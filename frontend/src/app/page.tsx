"use client";

import Link from "next/link";

export default function Home() {
	return (
		<div className="flex min-h-[calc(100vh-80px)] w-full flex-col items-center overflow-x-hidden bg-(--wrapper) p-8">
			{/* 
        We use xl:w-1/2 so that on very large screens they are side-by-side, 
        and on smaller screens (below 1280px) they stack vertically.
      */}
			<h1 className="text-center text-2xl font-bold text-(--header)">
				โปรดเลือกรายการที่ท่านต้องการดูข้อมูล
			</h1>
			<div className="my-4 flex flex-col sm:flex-row">
				<Link href={"/immigrants/repatriated"}>
					<div className="m-4 flex flex-1 flex-row items-center gap-8 rounded border-2 border-(--shadow) bg-(--container) p-8 shadow-[5px_5px_0px_var(--shadow)] transition-all hover:opacity-70 sm:flex-col">
						<div
							className="h-30 w-40 rounded-lg border-2 border-(--wrapper) sm:h-50"
							style={{
								backgroundColor: "var(--header)",
								WebkitMaskImage: "url('/return.png')",
								maskImage: "url('/return.png')",
								WebkitMaskSize: "cover",
								maskSize: "cover",
								WebkitMaskPosition: "center",
								maskPosition: "center",
								WebkitMaskRepeat: "no-repeat",
								maskRepeat: "no-repeat",
							}}
						/>
						<h1 className="font-bold text-(--header) sm:text-center">
							ผู้ถูกส่งกลับ (Repatriated)
						</h1>
					</div>
				</Link>
				<Link href={"/immigrants/illegal"}>
					<div className="m-4 flex flex-1 flex-row items-center gap-8 rounded border-2 border-(--shadow) bg-(--container) p-8 shadow-[5px_5px_0px_var(--shadow)] transition-all hover:opacity-70 sm:flex-col">
						<div
							className="h-30 w-40 rounded-lg border-2 border-(--wrapper) sm:h-50"
							style={{
								backgroundColor: "var(--header)",
								WebkitMaskImage: "url('/enter.png')",
								maskImage: "url('/enter.png')",
								WebkitMaskSize: "cover",
								maskSize: "cover",
								WebkitMaskPosition: "center",
								maskPosition: "center",
								WebkitMaskRepeat: "no-repeat",
								maskRepeat: "no-repeat",
							}}
						/>
						<h1 className="font-bold text-(--header) sm:text-center">
							ผู้ลักลอบเข้าเมือง (Illegal)
						</h1>
					</div>
				</Link>
			</div>
		</div>
	);
}
