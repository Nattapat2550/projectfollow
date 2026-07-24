import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { getDownloadImageUrl, getValidImageUrl } from "@/lib/imageUrl";

export default function ImageWithDialog({ photo_url }: { photo_url: string }) {
	return (
		<Dialog>
			<DialogTrigger className="relative h-full w-full">
				<Image
					src={getValidImageUrl(photo_url)}
					alt="Profile Image"
					className="h-full w-full cursor-pointer object-cover"
					sizes="25vw"
					fill
					preload
				/>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>รูปประจำตัว</DialogTitle>
				</DialogHeader>
				<div className="max-h-[75vh] overflow-y-auto">
					<div className="relative min-h-[75vh]">
						<Image
							src={getValidImageUrl(photo_url)}
							alt="Full Profile Image"
							className="object-contain"
							sizes="100vw"
							fill
						/>
					</div>
				</div>

				<DialogFooter>
					<DialogClose asChild>
						<Button variant="destructive">ปิด</Button>
					</DialogClose>
					<Link href={getDownloadImageUrl(photo_url)} target="_blank">
						<Button variant="outline">ดาวน์โหลด</Button>
					</Link>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
