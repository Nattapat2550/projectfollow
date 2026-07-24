import Image from "next/image";

import { getValidImageUrl } from "@/lib/imageUrl";

import ImageWithDialog from "./ImageWithDialog";

export default function RightPanelPassportCard({
	passport_photo_url,
}: {
	passport_photo_url?: string | null | undefined;
}) {
	return (
		<div className="flex w-full flex-col gap-6">
			<div className="border-wrapper rounded-2xl border bg-(--container) p-6 shadow-sm transition-colors">
				<h3 className="text-header mb-2 text-xl font-bold">หนังสือเดินทาง</h3>
				{passport_photo_url ?
					<div className="relative h-full w-full">
						<div className="relative mb-[5%] flex aspect-video w-full items-end justify-center overflow-hidden rounded-xl border border-[#a7f3d0] bg-white shadow-inner">
							<ImageWithDialog
								title="รูปหนังสือเดินทาง"
								photo_url={passport_photo_url}
								orient="horizontal"
							>
								<Image
									src={getValidImageUrl(passport_photo_url)}
									alt="Passport Image"
									className="h-full w-full cursor-pointer object-cover"
									sizes="25vw"
									fill
								/>
							</ImageWithDialog>
						</div>
					</div>
				:	"ไม่มีการบันทึกข้อมูลหนังสือเดินทาง"}
			</div>
		</div>
	);
}
