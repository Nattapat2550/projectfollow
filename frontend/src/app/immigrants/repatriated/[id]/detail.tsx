"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import RightPanel from "@/components/immigrants/RightPanel";
import UniversalImmigrantCard from "@/components/immigrants/UniversalImmigrantCard";
import { RepatriatedDetail } from "@/hooks/useRepatriatedDetail";

import RepatriatedIDPageEditForm from "./form";

export default function RepatriatedIDPageDetail({ detail }: { detail: RepatriatedDetail }) {
	const { states, actions } = detail;

	return (
		<div className="bg-background text-foreground min-h-screen p-6 transition-colors duration-200">
			<div className="mx-auto mb-6 max-w-7xl">
				{states.isEditing ?
					<button
						onClick={() => actions.setIsEditing(false)}
						className="flex cursor-pointer items-center gap-1 text-2xl font-bold text-(--header) transition hover:opacity-80"
					>
						<ChevronLeft size={32} />
						<span>แก้ไขฟอร์ม</span>
					</button>
				:	<Link
						href={`/immigrants/repatriated`}
						className="flex cursor-pointer items-center gap-1 text-2xl font-bold text-(--header) transition hover:opacity-80"
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
						<UniversalImmigrantCard data={states.initData} type={"repatriated"} />
					</div>
					<div className="w-full lg:col-span-5 xl:col-span-4">
						<RightPanel
							type={"repatriated"}
							data={states.initData}
							note={states.note}
							setNote={actions.setNote}
							onEditClick={() => actions.setIsEditing(true)}
						/>
					</div>
				</div>
			}
		</div>
	);
}
