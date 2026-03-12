package containers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/mauriciogm/dokploy/apps/monitoring/config"
	"github.com/mauriciogm/dokploy/apps/monitoring/database"
)

type ContainerMonitor struct {
	db        *database.DB
	isRunning bool
	mu        sync.Mutex
	stopChan  chan struct{}
	lastState map[string]string
}

func NewContainerMonitor(db *database.DB) (*ContainerMonitor, error) {
	if err := db.InitContainerMetricsTable(); err != nil {
		return nil, fmt.Errorf("failed to initialize container metrics table: %v", err)
	}

	return &ContainerMonitor{
		db:        db,
		stopChan:  make(chan struct{}),
		lastState: map[string]string{},
	}, nil
}

type ContainerAlertPayload struct {
	ServerType     string  `json:"ServerType"`
	Type           string  `json:"Type"`
	Value          float64 `json:"Value"`
	Threshold      float64 `json:"Threshold"`
	Message        string  `json:"Message"`
	Timestamp      string  `json:"Timestamp"`
	Token          string  `json:"Token"`
	ContainerName  string  `json:"ContainerName,omitempty"`
	CurrentStatus  string  `json:"CurrentStatus,omitempty"`
	PreviousStatus string  `json:"PreviousStatus,omitempty"`
}

func (cm *ContainerMonitor) Start() error {
	if err := LoadConfig(); err != nil {
		return fmt.Errorf("error loading config: %v", err)
	}

	// Check if there are services to monitor
	if len(monitorConfig.IncludeServices) == 0 {
		log.Printf("No services to monitor. Skipping container metrics collection")
		return nil
	}

	metricsConfig := config.GetMetricsConfig()
	refreshRate := metricsConfig.Containers.RefreshRate
	if refreshRate == 0 {
		refreshRate = 60 // default refresh rate
	}
	duration := time.Duration(refreshRate) * time.Second

	// log.Printf("Container metrics collection will run every %d seconds for services: %v", refreshRate, monitorConfig.IncludeServices)

	ticker := time.NewTicker(duration)
	go func() {
		for {
			select {
			case <-ticker.C:
				// Check again in case the configuration has changed
				if len(monitorConfig.IncludeServices) == 0 {
					log.Printf("No services to monitor. Stopping metrics collection")
					ticker.Stop()
					return
				}
				cm.collectMetrics()
			case <-cm.stopChan:
				ticker.Stop()
				return
			}
		}
	}()

	return nil
}

func (cm *ContainerMonitor) Stop() {
	close(cm.stopChan)
}

func (cm *ContainerMonitor) collectMetrics() {
	cm.mu.Lock()
	if cm.isRunning {
		cm.mu.Unlock()
		log.Println("Previous collection still running, skipping...")
		return
	}
	cm.isRunning = true
	cm.mu.Unlock()

	defer func() {
		cm.mu.Lock()
		cm.isRunning = false
		cm.mu.Unlock()
	}()

	cmd := exec.Command("docker", "stats", "--no-stream", "--format",
		`{"BlockIO":"{{.BlockIO}}","CPUPerc":"{{.CPUPerc}}","ID":"{{.ID}}","MemPerc":"{{.MemPerc}}","MemUsage":"{{.MemUsage}}","Name":"{{.Name}}","NetIO":"{{.NetIO}}"}`)

	output, err := cmd.CombinedOutput()

	// log.Printf("Output: %s", string(output))
	if err != nil {
		log.Printf("Error getting docker stats: %v", err)
		return
	}

	lines := string(output)
	if lines == "" {
		return
	}

	seenServices := make(map[string]bool)
	for _, line := range strings.Split(lines, "\n") {
		if line == "" {
			continue
		}

		var container Container
		if err := json.Unmarshal([]byte(line), &container); err != nil {
			log.Printf("Error parsing container data: %v", err)
			continue
		}

		if !ShouldMonitorContainer(container.Name) {
			continue
		}

		serviceName := GetServiceName(container.Name)

		if seenServices[serviceName] {
			continue
		}

		seenServices[serviceName] = true

		// log.Printf("Container: %+v", container)

		// Process metrics
		metric := processContainerMetrics(container)

		// log.Printf("Saving metrics for %s: %+v", serviceName, metric)

		if err := cm.db.SaveContainerMetric(metric); err != nil {
			log.Printf("Error saving metrics for %s: %v", serviceName, err)
		}

		cm.checkAndSendContainerHealth(container)
	}
}

func (cm *ContainerMonitor) checkAndSendContainerHealth(container Container) {
	currentState := cm.getContainerHealthStatus(container.ID)
	if currentState == "" {
		return
	}

	previousState, hasPrevious := cm.lastState[container.ID]
	cm.lastState[container.ID] = currentState

	if !hasPrevious {
		if isUnhealthyContainerState(currentState) {
			cm.sendContainerHealthAlert(container.Name, "unknown", currentState)
		}
		return
	}

	if previousState == currentState {
		return
	}

	if isUnhealthyContainerState(currentState) || isUnhealthyContainerState(previousState) {
		cm.sendContainerHealthAlert(container.Name, previousState, currentState)
	}
}

func isUnhealthyContainerState(state string) bool {
	state = strings.ToLower(strings.TrimSpace(state))
	return state == "unhealthy" || state == "exited" || state == "dead"
}

func (cm *ContainerMonitor) getContainerHealthStatus(containerID string) string {
	cmd := exec.Command(
		"docker",
		"inspect",
		containerID,
		"--format",
		"{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}",
	)
	output, err := cmd.Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(output))
}

func (cm *ContainerMonitor) sendContainerHealthAlert(containerName, previousState, currentState string) {
	cfg := config.GetMetricsConfig()

	payload := ContainerAlertPayload{
		ServerType:     cfg.Server.ServerType,
		Type:           "ContainerHealth",
		Value:          0,
		Threshold:      0,
		Message:        fmt.Sprintf("Container %s changed state from %s to %s", containerName, previousState, currentState),
		Timestamp:      time.Now().UTC().Format(time.RFC3339Nano),
		Token:          cfg.Server.Token,
		ContainerName:  containerName,
		CurrentStatus:  currentState,
		PreviousStatus: previousState,
	}

	if err := sendContainerAlert(cfg.Server.UrlCallback, payload); err != nil {
		log.Printf("failed to send container health alert: %v", err)
	}
}

func sendContainerAlert(callbackURL string, payload ContainerAlertPayload) error {
	if callbackURL == "" {
		return fmt.Errorf("callback URL is not set")
	}

	wrappedPayload := map[string]interface{}{
		"json": payload,
	}

	jsonData, err := json.Marshal(wrappedPayload)
	if err != nil {
		return fmt.Errorf("failed to marshal alert payload: %v", err)
	}

	resp, err := http.Post(callbackURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to send POST request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("received non-OK response status: %s, body: %s", resp.Status, string(bodyBytes))
	}

	return nil
}

func processContainerMetrics(container Container) *database.ContainerMetric {

	// Process CPU
	cpu, _ := strconv.ParseFloat(strings.TrimSuffix(container.CPUPerc, "%"), 64)

	// Process Memory
	memPerc, _ := strconv.ParseFloat(strings.TrimSuffix(container.MemPerc, "%"), 64)
	memParts := strings.Split(container.MemUsage, " / ")

	var usedValue, totalValue float64
	var usedUnit, totalUnit string

	if len(memParts) == 2 {
		// Process used memory
		usedParts := strings.Fields(memParts[0])
		if len(usedParts) > 0 {
			usedValue, _ = strconv.ParseFloat(strings.TrimRight(usedParts[0], "MiBGiB"), 64)
			usedUnit = strings.TrimLeft(usedParts[0], "0123456789.")
			// Convert MiB to MB and GiB to GB
			if usedUnit == "MiB" {
				usedUnit = "MB"
			} else if usedUnit == "GiB" {
				usedUnit = "GB"
			}
		}

		// Process total memory
		totalParts := strings.Fields(memParts[1])
		if len(totalParts) > 0 {
			totalValue, _ = strconv.ParseFloat(strings.TrimRight(totalParts[0], "MiBGiB"), 64)
			totalUnit = strings.TrimLeft(totalParts[0], "0123456789.")
			// Convert MiB to MB and GiB to GB
			if totalUnit == "MiB" {
				totalUnit = "MB"
			} else if totalUnit == "GiB" {
				totalUnit = "GB"
			}
		}
	}

	// Process Network I/O
	netParts := strings.Split(container.NetIO, " / ")

	var netInValue, netOutValue float64
	var netInUnit, netOutUnit string

	if len(netParts) == 2 {
		// Process input
		inParts := strings.Fields(netParts[0])
		if len(inParts) > 0 {
			netInValue, _ = strconv.ParseFloat(strings.TrimRight(inParts[0], "kMGTB"), 64)
			netInUnit = strings.TrimLeft(inParts[0], "0123456789.")
		}

		// Process output
		outParts := strings.Fields(netParts[1])
		if len(outParts) > 0 {
			netOutValue, _ = strconv.ParseFloat(strings.TrimRight(outParts[0], "kMGTB"), 64)
			netOutUnit = strings.TrimLeft(outParts[0], "0123456789.")
		}
	}

	// Process Block I/O
	blockParts := strings.Split(container.BlockIO, " / ")

	var blockReadValue, blockWriteValue float64
	var blockReadUnit, blockWriteUnit string

	if len(blockParts) == 2 {
		// Process read
		readParts := strings.Fields(blockParts[0])
		if len(readParts) > 0 {
			blockReadValue, _ = strconv.ParseFloat(strings.TrimRight(readParts[0], "kMGTB"), 64)
			blockReadUnit = strings.TrimLeft(readParts[0], "0123456789.")
		}

		// Process write
		writeParts := strings.Fields(blockParts[1])
		if len(writeParts) > 0 {
			blockWriteValue, _ = strconv.ParseFloat(strings.TrimRight(writeParts[0], "kMGTB"), 64)
			blockWriteUnit = strings.TrimLeft(writeParts[0], "0123456789.")
		}
	}

	return &database.ContainerMetric{
		Timestamp: time.Now().UTC().Format(time.RFC3339Nano),
		CPU:       cpu,
		Memory: database.MemoryMetric{
			Percentage: memPerc,
			Used:       usedValue,
			Total:      totalValue,
			UsedUnit:   usedUnit,
			TotalUnit:  totalUnit,
		},
		Network: database.NetworkMetric{
			Input:      netInValue,
			Output:     netOutValue,
			InputUnit:  netInUnit,
			OutputUnit: netOutUnit,
		},
		BlockIO: database.BlockIOMetric{
			Read:      blockReadValue,
			Write:     blockWriteValue,
			ReadUnit:  blockReadUnit,
			WriteUnit: blockWriteUnit,
		},
		Container: container.ID,
		ID:        container.ID,
		Name:      container.Name,
	}
}

func parseValue(value string) (float64, string) {
	parts := strings.Fields(value)
	if len(parts) < 1 {
		return 0, "B"
	}
	v, _ := strconv.ParseFloat(parts[0], 64)
	unit := strings.TrimLeft(value, "0123456789.")
	return v, unit
}
