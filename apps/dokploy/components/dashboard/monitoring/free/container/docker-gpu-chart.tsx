import { format } from "date-fns";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	YAxis,
} from "recharts";
import { useTranslation } from "@/hooks/use-translation";
import type { DockerStatsJSON } from "./show-free-container-monitoring";

interface Props {
	acummulativeData: DockerStatsJSON["gpu"];
}

export const DockerGpuChart = ({ acummulativeData }: Props) => {
	const { t } = useTranslation();
	const transformedData = acummulativeData
		.filter((item) => item.value.available)
		.map((item, index) => {
			return {
				name: t("monitoring.chart.point", { index: index + 1 }),
				time: item.time,
				usage: item.value.utilization,
			};
		});

	return (
		<div className="mt-6 w-full h-[10rem]">
			<ResponsiveContainer>
				<AreaChart
					data={transformedData}
					margin={{
						top: 10,
						right: 30,
						left: 0,
						bottom: 0,
					}}
				>
					<defs>
						<linearGradient id="colorGpu" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor="#27272A" stopOpacity={0.8} />
							<stop offset="95%" stopColor="white" stopOpacity={0} />
						</linearGradient>
					</defs>
					<YAxis stroke="#A1A1AA" domain={[0, 100]} />
					<CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
					{/* @ts-ignore */}
					<Tooltip content={<CustomTooltip />} />
					<Legend />
					<Area
						type="monotone"
						dataKey="usage"
						name={t("monitoring.gpuUsage")}
						stroke="#27272A"
						fillOpacity={1}
						fill="url(#colorGpu)"
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
};

interface CustomTooltipProps {
	active: boolean;
	payload?: {
		color?: string;
		dataKey?: string;
		value?: number;
		payload: {
			time: string;
			usage: number;
		};
	}[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
	const { t } = useTranslation();

	if (active && payload && payload.length && payload[0]) {
		const dateLabel = payload[0].payload.time
			? format(new Date(payload[0].payload.time), "PPpp")
			: "";
		return (
			<div className="custom-tooltip bg-background p-2 shadow-lg rounded-md text-primary border">
				{dateLabel && <p>{t("monitoring.chart.date", { value: dateLabel })}</p>}
				<p>
					{t("monitoring.gpuUsageValue", {
						value: payload[0].payload.usage,
					})}
				</p>
			</div>
		);
	}

	return null;
};
