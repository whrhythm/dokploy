package database

import (
	"database/sql"

	_ "github.com/mattn/go-sqlite3"
)

type DB struct {
	*sql.DB
}

func InitDB() (*DB, error) {
	db, err := sql.Open("sqlite3", "./monitoring.db")
	if err != nil {
		return nil, err
	}

	// Create metrics table if it doesn't exist
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS server_metrics (
			timestamp TEXT PRIMARY KEY,
			cpu REAL,
			cpu_model TEXT,
			cpu_cores INTEGER,
			cpu_physical_cores INTEGER,
			cpu_speed REAL,
			os TEXT,
			distro TEXT,
			kernel TEXT,
			arch TEXT,
			mem_used REAL,
			mem_used_gb REAL,
			mem_total REAL,
			uptime INTEGER,
			disk_used REAL,
			total_disk REAL,
			network_in REAL,
			network_out REAL,
			gpu_available INTEGER DEFAULT 0,
			gpu_count INTEGER DEFAULT 0,
			gpu_utilization REAL DEFAULT 0,
			gpu_memory_used_mb REAL DEFAULT 0,
			gpu_memory_total_mb REAL DEFAULT 0
		)
	`)
	if err != nil {
		return nil, err
	}

	alterStatements := []string{
		"ALTER TABLE server_metrics ADD COLUMN gpu_available INTEGER DEFAULT 0",
		"ALTER TABLE server_metrics ADD COLUMN gpu_count INTEGER DEFAULT 0",
		"ALTER TABLE server_metrics ADD COLUMN gpu_utilization REAL DEFAULT 0",
		"ALTER TABLE server_metrics ADD COLUMN gpu_memory_used_mb REAL DEFAULT 0",
		"ALTER TABLE server_metrics ADD COLUMN gpu_memory_total_mb REAL DEFAULT 0",
	}

	for _, stmt := range alterStatements {
		_, _ = db.Exec(stmt)
	}

	return &DB{db}, nil
}
