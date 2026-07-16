"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";

import { useRepatriatedDetail } from "@/hooks/useRepatriatedDetail";

import RepatriatedIDPageDetail from "./detail";

export default function RepatriatedIDPage() {
	const { id } = useParams<{ id: string }>();
	const detail = useRepatriatedDetail(id);

	const fetch = detail.actions.fetchData;

	useEffect(() => {
		fetch();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (detail.states.isFound === undefined)
		return <div className="flex h-screen items-center justify-center">กำลังโหลดข้อมูล...</div>;

	return detail.states.initData ?
			<RepatriatedIDPageDetail detail={detail} />
		:	detail.states.isFound === false && (
				<div className="flex h-screen flex-col items-center justify-center gap-4">
					<p className="text-xl font-bold text-red-500">ไม่พบข้อมูล ID: &quot;{id}&quot;</p>
					<button className="rounded-md bg-slate-200 px-4 py-2 text-slate-800">
						<a href={`/immigrants/repatriated/${id}`}>ย้อนกลับ</a>
					</button>
				</div>
			);
}
