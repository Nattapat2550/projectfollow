"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";

import { useIllegalDetail } from "@/hooks/useIllegalDetail";

import IllegalIDPageDetail from "./detail";

export default function IllegalIDPage() {
	const { id } = useParams<{ id: string }>();
	const detail = useIllegalDetail(id);

	const fetch = detail.actions.fetchData;

	// FIX
	useEffect(() => {
		fetch();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (detail.states.isFound === undefined)
		return <div className="flex h-screen items-center justify-center">กำลังโหลดข้อมูล...</div>;

	return detail.states.initData ?
			<IllegalIDPageDetail detail={detail} />
		:	detail.states.isFound === false && (
				<div className="flex h-screen flex-col items-center justify-center gap-4">
					<p className="text-xl font-bold text-red-500">ไม่พบข้อมูล ID: &quot;{id}&quot;</p>
					<button className="rounded-md bg-slate-200 px-4 py-2 text-slate-800">
						<a href={`/immigrants/illegal`}>ย้อนกลับ</a>
					</button>
				</div>
			);
}
