import React from "react";

import { ChartItem } from "@/hooks/useDashboard";

export default function BarChart({ data, title }: { data: ChartItem[]; title: string }) {
	const total = data.reduce((s, d) => s + d.value, 0);
	if (total === 0) return null;

	return (
		<div className="flex w-full flex-col items-start justify-start gap-4 overflow-hidden bg-transparent xl:min-w-50 xl:flex-1">
			<p className="shrink-0 text-sm font-semibold text-header">{title}</p>

			{/* ส่วนของกราฟแท่ง (Stacked Bar) รวมอยู่ในแท่งเดียว */}
			<div className="flex h-5 w-full overflow-hidden rounded-full bg-zinc-950/5 shadow-sm dark:bg-white/5">
				{data.map((d, i) => {
					const pct = (d.value / total) * 100;
					return (
						<div
							key={i}
							style={{ width: `${pct}%`, backgroundColor: d.color }}
							className="h-full cursor-pointer transition-all duration-500 ease-out hover:opacity-80"
							title={`${d.name}: ${d.value.toLocaleString("th-TH")} (${pct.toFixed(1)}%)`}
						/>
					);
				})}
			</div>

			{/* คำอธิบายข้อมูล (Legend) */}
			<div className="mt-1 flex w-full flex-col gap-1.5">
				{data.map((d, i) => {
					const pct = ((d.value / total) * 100).toFixed(1);
					return (
						<div key={i} className="flex items-center gap-2 text-xs">
							<span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: d.color }} />
							<span className="text-foreground flex-1 truncate font-medium">{d.name}</span>
							<span className="shrink-0 font-mono font-semibold text-header">
								{d.value.toLocaleString("th-TH")}{" "}
								<span className="text-[10px] opacity-60">({pct}%)</span>
							</span>
						</div>
					);
				})}
			</div>

			{/* สรุปยอดรวม */}
			<div className="mt-1 flex w-full justify-between border-t border-wrapper pt-2 text-xs text-header opacity-80">
				<span>รวมทั้งหมด</span>
				<span className="font-bold">{total.toLocaleString("th-TH")} รายการ</span>
			</div>
		</div>
	);
}
