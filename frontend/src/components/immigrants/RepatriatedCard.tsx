import React, { useState, useEffect } from "react";

interface RepatriatedCardProps {
	data: any;
	isExporting?: boolean;
}

// ฟังก์ชันดึง Thumbnail จาก Google Drive
const getDirectImageUrl = (url: string, uniqueId?: string) => {
	if (!url) return "";
	let driveId = "";

	const matchFileD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
	if (matchFileD && matchFileD[1]) {
		driveId = matchFileD[1];
	} else {
		const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
		if (matchId && matchId[1]) {
			driveId = matchId[1];
		}
	}

	if (driveId) {
		const thumbnailUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
		let proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(thumbnailUrl)}`;
		if (uniqueId) proxyUrl += `&_id=${uniqueId}`;
		return proxyUrl;
	}
	return url;
};

const Base64Image = ({
	src,
	alt,
	className,
	crossOrigin,
	referrerPolicy,
}: any) => {
	const [base64, setBase64] = useState<string>(src);

	useEffect(() => {
		if (
			!src
			|| src.startsWith("data:")
			|| src.startsWith("blob:")
			|| src.startsWith("/")
		) {
			setBase64(src);
			return;
		}
		let isMounted = true;
		fetch(src)
			.then((res) => res.blob())
			.then((blob) => {
				const reader = new FileReader();
				reader.onloadend = () => {
					if (isMounted && reader.result) {
						setBase64(reader.result as string);
					}
				};
				reader.readAsDataURL(blob);
			})
			.catch((err) => {
				console.error("Failed to load image as base64", err);
			});

		return () => {
			isMounted = false;
		};
	}, [src]);

	return (
		<img
			src={base64}
			alt={alt}
			className={className}
			crossOrigin={crossOrigin}
			referrerPolicy={referrerPolicy}
		/>
	);
};

export default function RepatriatedCard({
	data,
	isExporting = false,
}: RepatriatedCardProps) {
	const fullNameTh = `${data.first_name_th}${data.middle_name_th ? " " + data.middle_name_th : ""} ${data.last_name_th}`;
	const fullNameEn =
		data.first_name_en ?
			`${data.first_name_en}${data.middle_name_en ? " " + data.middle_name_en : ""} ${data.last_name_en ?? ""}`.trim()
		:	"";

	const formatId = (id: string): string => {
		if (!id || id.length < 13) return id || "-";
		return id.replace(/^(\d)(\d{4})(\d{5})(\d{2})(\d)$/, "$1-$2-$3-$4-$5");
	};

	return (
		<div
			className="relative w-full overflow-hidden rounded-2xl border border-[#9DCFE8] bg-[#C8E8F5] font-sans shadow-md"
			style={{ aspectRatio: "856 / 540" }}
		>
			<div className="absolute inset-0 flex flex-col p-[4%]">
				<div className="mb-[3%] flex items-start justify-between">
					<div className="flex items-center gap-[3%]">
						<div
							className="shrink-0 overflow-hidden rounded-full bg-white shadow-inner"
							style={{ width: "11%", aspectRatio: "1/1" }}
						>
							<img src={"/return.png"} className="translate-y-[-0px]"></img>
						</div>
						<div>
							<p
								className="leading-tight font-bold text-slate-900"
								style={{ fontSize: "clamp(10px, 3.2vw, 28px)" }}
							>
								ผู้ถูกส่งตัวกลับ
							</p>
							<p
								className="font-medium text-slate-700"
								style={{ fontSize: "clamp(7px, 1.6vw, 14px)" }}
							>
								เลขประจำตัวประชาชน
							</p>
						</div>
					</div>

					<div
						className="flex items-center justify-center rounded-xl bg-[#A8D8EA] font-mono font-bold tracking-widest text-slate-900 shadow-sm"
						style={{
							fontSize: "clamp(8px, 2vw, 18px)",
							padding: "1.5% 3%",
							minWidth: "36%",
						}}
					>
						{formatId(data.national_id)}
					</div>
				</div>

				<div className="flex min-h-0 flex-1 gap-[3%]">
					<div className="flex min-w-0 flex-1 flex-col gap-[3%]">
						<FieldRow label="ชื่อ-นามสกุล">
							<FieldBox>{fullNameTh}</FieldBox>
						</FieldRow>
						<FieldRow label="">
							<FieldBox>{fullNameEn}</FieldBox>
						</FieldRow>

						<div className="flex items-center gap-[2%]">
							<span
								className="shrink-0 font-semibold whitespace-nowrap text-slate-800"
								style={{ fontSize: "clamp(6px, 1.5vw, 13px)", width: "28%" }}
							>
								วันเดือนปีเกิด
							</span>
							<FieldBox mono className="flex-1">
								{data.date_of_birth || "-"}
							</FieldBox>
							<span
								className="shrink-0 font-semibold text-slate-800"
								style={{ fontSize: "clamp(6px, 1.5vw, 13px)" }}
							>
								อายุ
							</span>
							<FieldBox mono className="w-[14%] text-center">
								{data.age ?? "-"}
							</FieldBox>
							<span
								className="shrink-0 font-semibold text-slate-800"
								style={{ fontSize: "clamp(6px, 1.5vw, 13px)" }}
							>
								ปี
							</span>
						</div>

						<FieldRow label="เลขพาสปอร์ต">
							<FieldBox>{data.passport_id ?? "-"}</FieldBox>
						</FieldRow>

						<div className="flex min-h-0 flex-1 gap-[2%]">
							<span
								className="shrink-0 pt-[1%] font-semibold whitespace-nowrap text-slate-800"
								style={{ fontSize: "clamp(6px, 1.5vw, 13px)", width: "28%" }}
							>
								ที่อยู่
							</span>
							<div
								className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-slate-300 bg-white"
								style={{ padding: "2% 3%" }}
							>
								<span
									className="font-medium text-slate-900"
									style={{ fontSize: "clamp(6px, 1.4vw, 12px)" }}
								>
									{data.address || "-"}
								</span>
							</div>
						</div>
					</div>

					<div
						className="relative mt-[1%] flex shrink-0 items-center justify-center self-start overflow-hidden rounded-xl border border-slate-300 bg-white shadow-inner"
						style={{ width: "21%", aspectRatio: "3/4" }}
					>
						{data.photo_url ?
							<Base64Image
								src={getDirectImageUrl(
									data.photo_url,
									data.id || Math.random().toString()
								)}
								alt="Profile"
								className="h-full w-full object-cover"
								referrerPolicy="no-referrer" /* กุญแจสำคัญในการเลี่ยงการบล็อก */
							/>
						:	<>
								<div className="flex h-full w-full flex-col items-center justify-end pb-[8%]">
									<div
										className="rounded-full bg-[#BDBDBD]"
										style={{
											width: "42%",
											aspectRatio: "1/1",
											marginBottom: "4%",
										}}
									/>
									<div
										className="rounded-t-full bg-[#BDBDBD]"
										style={{ width: "72%", height: "38%" }}
									/>
								</div>
								<span
									className="absolute top-[4%] right-[8%] leading-none font-light text-slate-300"
									style={{ fontSize: "clamp(8px, 2vw, 18px)" }}
								>
									?
								</span>
							</>
						}
					</div>
				</div>
			</div>
		</div>
	);
}

function FieldRow({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-center gap-[2%]">
			<span
				className="shrink-0 font-semibold whitespace-nowrap text-slate-800"
				style={{ fontSize: "clamp(6px, 1.5vw, 13px)", width: "28%" }}
			>
				{label}
			</span>
			<div className="min-w-0 flex-1">{children}</div>
		</div>
	);
}
function FieldBox({
	children,
	mono = false,
	className = "",
}: {
	children: React.ReactNode;
	mono?: boolean;
	className?: string;
}) {
	return (
		<div
			className={`truncate rounded-lg border border-slate-300 bg-white font-semibold text-slate-900 ${mono ? "font-mono" : ""} ${className}`}
			style={{ fontSize: "clamp(6px, 1.5vw, 13px)", padding: "2% 4%" }}
		>
			{children}
		</div>
	);
}
