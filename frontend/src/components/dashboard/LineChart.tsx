import React from "react";
import { ChartItem } from "@/hooks/useDashboard";

export default function LineChart({ data, title }: { data: ChartItem[]; title: string }) {
	const total = data.reduce((s, d) => s + d.value, 0);
	if (data.length === 0) return null;

	const maxValue = Math.max(...data.map((d) => d.value), 1);
	const maxX = data.length - 1 || 1;

	const points = data.map((d, i) => {
		const x = (i / maxX) * 100; // 0 to 100%
		const y = 100 - (d.value / maxValue) * 100; // 0 to 100%
		return { x, y, value: d.value, name: d.name, color: d.color };
	});

	const pathPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

	return (
		<div className="flex w-full flex-col items-start justify-start gap-4 bg-transparent xl:min-w-50 xl:flex-1">
			<p className="shrink-0 text-sm font-semibold text-(--header)">{title}</p>

			<div className="relative mt-2 flex h-48 w-full gap-3 pr-2">
				{/* Y-Axis */}
				<div
					className="flex w-6 shrink-0 flex-col items-end justify-between font-mono text-[10px] text-(--foreground) opacity-70"
					style={{ height: "calc(100% - 2rem)" }}
				>
					<span className="-mt-1.5">{Math.round(maxValue).toLocaleString("th-TH")}</span>
					<span className="-mt-1.5">{Math.round(maxValue * 0.75).toLocaleString("th-TH")}</span>
					<span className="-mt-1.5">{Math.round(maxValue * 0.5).toLocaleString("th-TH")}</span>
					<span className="-mt-1.5">{Math.round(maxValue * 0.25).toLocaleString("th-TH")}</span>
					<span className="-mt-1.5">0</span>
				</div>

				{/* Graph Area and X-Axis */}
				<div className="relative flex min-w-0 flex-1 flex-col">
					<div className="relative w-full flex-1">
						<svg
							className="absolute inset-0 h-full w-full overflow-visible"
							preserveAspectRatio="none"
							viewBox="0 0 100 100"
						>
							{/* Grid lines */}
							{[0, 25, 50, 75, 100].map((y) => (
								<line
									key={y}
									x1="0"
									y1={y}
									x2="100"
									y2={y}
									stroke="var(--wrapper)"
									strokeWidth="0.5"
									strokeDasharray="2 2"
								/>
							))}
							{/* Line */}
							<polyline
								fill="none"
								stroke="var(--blueText)"
								strokeWidth="2"
								strokeLinejoin="round"
								strokeLinecap="round"
								vectorEffect="non-scaling-stroke"
								points={pathPoints}
							/>
						</svg>
						{/* Data Points and Tooltips */}
						{points.map((p, i) => (
							<div
								key={i}
								className="group absolute -mt-1.5 -ml-1.5 h-3 w-3 cursor-pointer rounded-full border-2 border-(--container) bg-(--blueText) transition-transform hover:scale-150"
								style={{ left: `${p.x}%`, top: `${p.y}%` }}
							>
								<div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded bg-(--header) px-2 py-1 text-[10px] whitespace-nowrap text-(--container) opacity-0 transition-opacity group-hover:opacity-100">
									{p.name}: {p.value.toLocaleString("th-TH")}
								</div>
							</div>
						))}
					</div>
					{/* X-Axis Labels */}
					<div className="relative mt-2 h-6 w-full text-[10px] text-(--foreground) opacity-70">
						{points.map((p, i) => {
							// Show at most 6 labels to avoid overlap
							const step = Math.ceil(data.length / 6);
							if (i % step !== 0 && i !== data.length - 1) return null;
							// abbreviate month names if needed, but 'Mon YYYY' is short enough
							const label = p.name.split(" ")[0];
							return (
								<div
									key={i}
									className="absolute top-0 -translate-x-1/2 text-center whitespace-nowrap"
									style={{ left: `${p.x}%` }}
								>
									{label}
								</div>
							);
						})}
					</div>
				</div>
			</div>

			<div className="mt-1 flex w-full justify-between border-t border-(--wrapper) pt-2 text-xs text-(--header) opacity-80">
				<span>รวมทั้งหมด</span>
				<span className="font-bold">{total.toLocaleString("th-TH")} รายการ</span>
			</div>
		</div>
	);
}
