"use client";

import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React from "react";

import ImmigrantEditForm from "@/app/immigrants/[id]/ImmigrantEditForm";
import RightPanel from "@/components/immigrants/RightPanel";
import UniversalImmigrantCard from "@/components/immigrants/UniversalImmigrantCard";
import { useImmigrantDetail } from "@/hooks/useImmigrantDetail";

export default function ImmigrantDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = params?.id as string;

	const { states, actions } = useImmigrantDetail(id);

	if (states.loading)
		return <div className="flex h-screen items-center justify-center">กำลังโหลดข้อมูล...</div>;

	if (!states.person || !states.personType) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-4">
				<p className="text-xl font-bold text-red-500">ไม่พบข้อมูล ID: &quot;{id}&quot;</p>
				<button
					onClick={() => router.back()}
					className="rounded-md bg-slate-200 px-4 py-2 text-slate-800"
				>
					ย้อนกลับ
				</button>
			</div>
		);
	}

	return (
		<div className="bg-background text-foreground min-h-screen p-6 transition-colors duration-200">
			<div className="mx-auto mb-6 max-w-7xl">
				<button
					onClick={() => (states.isEditing ? actions.setIsEditing(false) : router.back())}
					className="flex cursor-pointer items-center gap-1 text-2xl font-bold text-(--header) transition hover:opacity-80"
				>
					<ChevronLeft size={32} />
					<span>{states.isEditing ? `แก้ไขฟอร์ม` : `รายละเอียด`}</span>
				</button>
			</div>

			{states.isEditing ?
				<ImmigrantEditForm
					id={id}
					personType={states.personType as "illegal" | "repatriated"}
					onCancel={() => actions.setIsEditing(false)}
					onSaveSuccess={async () => {
						await actions.fetchData();
						actions.setIsEditing(false);
					}}
					initialData={states.person}
				/>
			:	<div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 lg:grid-cols-12">
					<div className="w-full lg:col-span-7 xl:col-span-8">
						<UniversalImmigrantCard
							data={states.person}
							type={states.personType as "illegal" | "repatriated"}
						/>
					</div>
					<div className="w-full lg:col-span-5 xl:col-span-4">
						<RightPanel
							type={states.personType}
							data={states.person}
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
