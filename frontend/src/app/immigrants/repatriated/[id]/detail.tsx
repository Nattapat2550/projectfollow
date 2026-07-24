"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { RepatriatedDetail } from "@/hooks/useRepatriatedDetail";

import RepatriatedIDPageCard from "./card";
import RepatriatedIDPageEditForm from "./form";
import RepatriatedIDPageDetailRightPanel from "./right-panel";

export default function RepatriatedIDPageDetail({ detail }: { detail: RepatriatedDetail }) {
	const { states, actions } = detail;

	return (
		<div className="bg-background text-foreground min-h-screen p-6 transition-colors duration-200">
			<div className="mx-auto mb-6 max-w-7xl">
				{states.isEditing ?
					<button
						onClick={() => actions.setIsEditing(false)}
						className="text-header flex cursor-pointer items-center gap-1 text-2xl font-bold transition hover:opacity-80"
					>
						<ChevronLeft size={32} />
						<span>แก้ไขฟอร์ม</span>
					</button>
				:	<Link
						href={`/immigrants/repatriated`}
						className="text-header flex cursor-pointer items-center gap-1 text-2xl font-bold transition hover:opacity-80"
					>
						<ChevronLeft size={32} />
						<span>รายละเอียด</span>
					</Link>
				}
			</div>

			{states.isEditing ?
				<RepatriatedIDPageEditForm detail={detail} />
			:	<div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 lg:grid-cols-12">
					<div className="w-full lg:col-span-7 xl:col-span-8">
						<RepatriatedIDPageCard data={states.initData} />
					</div>
					<div className="w-full lg:col-span-5 xl:col-span-4">
						<RepatriatedIDPageDetailRightPanel detail={detail} />
					</div>
				</div>
			}
		</div>
	);
}
