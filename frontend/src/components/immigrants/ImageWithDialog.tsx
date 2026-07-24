import Image from "next/image";
import Link from "next/link";
import React from "react";

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
import { cn } from "@/lib/utils";

export default function ImageWithDialog({
	title,
	orient,
	photo_url,
	children,
}: {
	title: string;
	photo_url: string;
	orient: "horizontal" | "vertical";
	children: React.ReactNode;
}) {
	return (
		<Dialog>
			<DialogTrigger className="relative h-full w-full">{children}</DialogTrigger>
			<DialogContent className="w-max max-w-[90vw]!">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<div className={cn("max-h-[75vh] max-w-[85vw] overflow-x-auto overflow-y-auto")}>
					<div
						className={cn(
							"relative h-full w-full",
							orient == "vertical" ?
								"aspect-3/4 min-h-[50vh] sm:min-h-[70vh]"
							:	"aspect-4/3 min-w-[80vw] sm:min-w-[50vw]"
						)}
					>
						<Image
							src={getValidImageUrl(photo_url)}
							alt="Full Profile Image"
							className="h-full w-full object-contain object-center"
							sizes="50vw"
							fill
						/>
					</div>
				</div>

				<DialogFooter>
					<DialogClose asChild>
						<Button variant="destructive">ปิด</Button>
					</DialogClose>
					<Link href={getDownloadImageUrl(photo_url)} target="_blank">
						<Button className="w-full" variant="outline">
							ดาวน์โหลด
						</Button>
					</Link>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
