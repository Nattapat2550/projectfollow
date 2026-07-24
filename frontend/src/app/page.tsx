"use client";

import Link from "next/link";

import RepatriatedUserIcon from "@/components/icons/repatriated-user";
import UserIcon from "@/components/icons/user";

export default function Home() {
	return (
		<div className="bg-wrapper flex min-h-[calc(100vh-80px)] w-full flex-col items-center overflow-x-hidden p-8">
			{/* 
        We use xl:w-1/2 so that on very large screens they are side-by-side, 
        and on smaller screens (below 1280px) they stack vertically.
      */}
			<h1 className="text-header text-center text-2xl font-bold">
				โปรดเลือกรายการที่ท่านต้องการดูข้อมูล
			</h1>
			<div className="my-4 flex flex-col sm:flex-row">
				<Link href={"/immigrants/repatriated"}>
					<div className="m-4 flex flex-1 flex-row items-center gap-8 rounded border-2 border-(--shadow) bg-(--container) p-8 shadow-[5px_5px_0px_var(--shadow)] transition-all hover:opacity-70 sm:flex-col">
						<RepatriatedUserIcon className="h-30 w-40 object-contain select-none sm:h-50" />
						<h1 className="text-header font-bold sm:text-center">ผู้ถูกส่งกลับ (Repatriated)</h1>
					</div>
				</Link>
				<Link href={"/immigrants/illegal"}>
					<div className="m-4 flex flex-1 flex-row items-center gap-8 rounded border-2 border-(--shadow) bg-(--container) p-8 shadow-[5px_5px_0px_var(--shadow)] transition-all hover:opacity-70 sm:flex-col">
						<UserIcon className="h-30 w-40 object-contain select-none sm:h-50" />
						<h1 className="text-header font-bold sm:text-center">ผู้ลักลอบเข้าเมือง (Illegal)</h1>
					</div>
				</Link>
			</div>
		</div>
	);
}
