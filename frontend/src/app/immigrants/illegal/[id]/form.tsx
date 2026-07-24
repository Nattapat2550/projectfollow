"use client";

import { Save, X } from "lucide-react";

import SingleImageField from "@/components/form/single-image-field";
import { IllegalDetail } from "@/hooks/useIllegalDetail";

import CreateIllegalPageForm from "../create/form";

export default function IllegalIDPageEditForm({ detail }: { detail: IllegalDetail }) {
	const { states, actions, handlers } = detail;

	return (
		<div className="bg-background text-foreground min-h-screen p-6 transition-colors duration-200">
			<form
				onSubmit={handlers.handleSave}
				className="mx-auto mb-12 max-w-2xl rounded-2xl border border-gray-100 bg-(--container) p-6 shadow-xl sm:p-8 dark:border-zinc-800"
			>
				<div className="mb-6 grid grid-cols-1 gap-8 rounded-xl p-6 md:grid-cols-2">
					<div>
						<h3 className="mb-4 text-lg font-bold">รูปภาพประจำตัว</h3>
						<SingleImageField
							id="Person Image"
							previewUrl={states.imagePreview || "/user.svg"}
							props={{ alt: "Person Preview" }}
							uploadLabel="แก้ไขรูปประจำตัว"
							editLabel="แก้ไขรูปประจำตัว"
							removeLabel="ลบรูปภาพ"
							file={states.imageFile}
							setFile={actions.setImageFile}
							deletable={false}
						/>
					</div>
					<div>
						<h3 className="mb-4 text-lg font-bold">รูปถ่ายพาสปอร์ต</h3>
						<SingleImageField
							id="Passport Image"
							previewUrl={states.passportImagePreview || "/passport.png"}
							props={{ alt: "Passport Preview" }}
							uploadLabel="แก้ไขรูปพาสปอร์ต"
							editLabel="แก้ไขรูปพาสปอร์ต"
							removeLabel="ลบรูปภาพ"
							file={states.passportFile}
							setFile={actions.setPassportFile}
							deletable={false}
						/>
					</div>
				</div>

				<CreateIllegalPageForm
					formData={states.formData}
					setFormData={actions.setFormData}
					handleInputChange={handlers.handleInputChange}
				/>

				<div className="mt-8 flex justify-end gap-3 border-t border-(--wrapper) pt-6">
					<button
						type="button"
						onClick={() => {
							actions.setIsEditing(false);
						}}
						className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-stone-200 px-4 py-2 text-sm font-bold text-slate-800 transition hover:opacity-90 dark:bg-stone-800 dark:text-slate-200"
					>
						<X size={16} /> ยกเลิก
					</button>
					<button
						type="submit"
						disabled={states.isSaving}
						className="text-background flex cursor-pointer items-center gap-1.5 rounded-lg bg-(--header) px-4 py-2 text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
					>
						<Save size={16} /> {states.isSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
					</button>
				</div>
			</form>
		</div>
	);
}
