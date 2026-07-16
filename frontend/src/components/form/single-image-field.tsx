"use client";

import { ImageIcon, X } from "lucide-react";
import Image, { ImageProps } from "next/image";
import React, { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type SingleImageFieldProps = {
	file: File | undefined | null;
	setFile: React.Dispatch<React.SetStateAction<File | null>>;
	previewUrl: string;
	onChange?: React.ChangeEventHandler<HTMLInputElement>;
	onRemove?: () => void;
	uploadLabel: string;
	editLabel: string;
	removeLabel: string;
	uploadIcon?: React.ReactElement;
	editIcon?: React.ReactElement;
	removeIcon?: React.ReactElement;
	props?: Partial<ImageProps>;
};

export default function SingleImageField({
	file,
	setFile,
	previewUrl,
	onChange = (e) => {
		const file = e.target.files?.[0];
		if (file) setFile(file);
	},
	onRemove = () => {
		setFile(null);
	},
	uploadLabel,
	editLabel,
	removeLabel,
	uploadIcon = <ImageIcon size={16} />,
	editIcon = <ImageIcon size={16} />,
	removeIcon = <X size={16} />,
	props,
}: SingleImageFieldProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [dragover, setDragover] = useState(false);

	useEffect(() => {
		if (inputRef.current) {
			const dataTransfer = new DataTransfer();
			if (file) {
				dataTransfer.items.add(file);
			}
			inputRef.current.files = dataTransfer.files;
		}
	}, [file]);

	return (
		<div className="relative flex flex-col items-start gap-4">
			<label
				htmlFor="image-file-input"
				className="group relative size-40"
				onDragEnter={() => setDragover(true)}
				onDragLeave={() => setDragover(false)}
				onDragExit={() => setDragover(false)}
				onDragEnd={() => setDragover(false)}
				onDrop={() => setDragover(false)}
			>
				{/* File Receptor */}
				<input
					id="image-file-input"
					type="file"
					accept="image/*"
					ref={inputRef}
					onChange={onChange}
					className="absolute top-0 left-0 block h-full w-full cursor-pointer opacity-0"
				/>

				<div className="pointer-events-none relative size-40 select-none">
					{/* Image */}
					<Image
						{...props}
						src={file ? URL.createObjectURL(file) : previewUrl}
						alt={props?.alt ?? "Image Preview"}
						className={cn(
							"size-40 rounded-xl border border-gray-200 bg-white object-cover p-1 shadow-sm",
							dragover ? "opacity-40" : "opacity-100"
						)}
						width={160}
						height={160}
					/>
					{/* Drag Overlay */}
					<div
						className={cn(
							"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity",
							dragover ? "opactiy-100" : "opacity-0"
						)}
					>
						<ImageIcon size={64} />
					</div>
				</div>
			</label>
			<div className="flex flex-col gap-2">
				<div className="flex flex-col gap-3">
					<label htmlFor="image-file-input">
						<div
							role="button"
							className="flex cursor-pointer items-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm text-white hover:opacity-90"
						>
							{file ? editIcon : uploadIcon}
							<span>{file ? editLabel : uploadLabel}</span>
						</div>
					</label>
					{file && (
						<button
							type="button"
							className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
							onClick={onRemove}
						>
							{removeIcon}
							<span>{removeLabel}</span>
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
