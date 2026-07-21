/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";

import { COUNTRY_MAP } from "@/constants/country";

type UniversalImmigrantCardProps =
	| {
			type: "illegal";
			data: IllegalData;
	  }
	| {
			type: "repatriated";
			data: RepatriatedData;
	  };

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

	// For other external URLs, proxy them as well if they might have CORS issues
	if (url.startsWith("http")) {
		let proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
		if (uniqueId) proxyUrl += `&_id=${uniqueId}`;
		return proxyUrl;
	}

	return url;
};

const formatNationalId = (id: string): string => {
	if (!id || id.trim().length !== 13) return id || "-";
	return id.replace(/^(\d)(\d{4})(\d{5})(\d{2})(\d)$/, "$1-$2-$3-$4-$5");
};

const formatDate = (dateString: string | null | undefined): string => {
	if (!dateString) return "-";
	try {
		const date = new Date(dateString);
		return isNaN(date.getTime()) ? "-" : (
				date.toLocaleDateString("th-TH", {
					day: "2-digit",
					month: "2-digit",
					year: "numeric",
				})
			);
	} catch {
		return "-";
	}
};

const SORTED_COUNTRY_KEYS = Object.keys(COUNTRY_MAP).sort((a, b) => b.length - a.length);

const getFlagUrl = (nationality: string) => {
	if (!nationality) return null;
	const nat = nationality.trim().toLowerCase();
	const foundKey = SORTED_COUNTRY_KEYS.find((key) => nat.includes(key));
	return foundKey ? `https://flagcdn.com/w40/${COUNTRY_MAP[foundKey]}.png` : null;
};

const Base64Image = (
	props: Omit<React.ComponentPropsWithoutRef<"img">, "src"> & { src: string }
) => {
	const { src } = props;

	const [base64, setBase64] = useState<string>(src);

	useEffect(() => {
		if (!src || src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("/")) {
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

	return <img {...props} alt={props.alt ?? "profile photo"} src={base64} />;
};

export default function UniversalImmigrantCard({ data, type }: UniversalImmigrantCardProps) {
	if (!data) return null;

	const isIllegal = type === "illegal";
	const flagUrl = data.nationality ? getFlagUrl(data.nationality) : undefined;

	// แยกชื่อ ไทย-อังกฤษ
	const fullNameTh =
		`${data.first_name_th || ""}${data.middle_name_th ? " " + data.middle_name_th : ""} ${data.last_name_th || ""}`.trim();
	const fullNameEn =
		data.first_name_en ?
			`${data.first_name_en}${data.middle_name_en ? " " + data.middle_name_en : ""} ${data.last_name_en ?? ""}`.trim()
		:	"";

	// วันที่พบตัว / ส่งกลับ
	const dateValue = formatDate(isIllegal ? data.detected_date : data.return_date);

	// วันเดือนปีเกิด
	const getDobText = () => {
		if (data.date_of_birth) {
			return formatDate(data.date_of_birth);
		}
		return "-";
	};

	// ข้อมูลสถานที่ / ที่อยู่
	const getLocationText = () => {
		if (isIllegal) {
			const parts = [];
			if (data.workplace) parts.push(`ที่ทำงาน: ${data.workplace}`);
			if (data.detected_location_details) parts.push(data.detected_location_details);

			const subParts = [
				data.detected_location_sub_district ? `ต.${data.detected_location_sub_district}` : "",
				data.detected_location_district ? `อ.${data.detected_location_district}` : "",
				data.detected_location_province ? `จ.${data.detected_location_province}` : "",
			]
				.filter(Boolean)
				.join(" ");

			if (subParts) parts.push(subParts);
			return parts.join(" | ") || "-";
		} else {
			const parts = [];
			if (data.address_details) parts.push(data.address_details);

			const subParts = [
				data.building ? `อาคาร${data.building}` : "",
				data.floor ? `ชั้น${data.floor}` : "",
				data.room ? `ห้อง${data.room}` : "",
				data.sub_district ? `ต.${data.sub_district}` : "",
				data.district ? `อ.${data.district}` : "",
				data.province ? `จ.${data.province}` : "",
			]
				.filter(Boolean)
				.join(" ");

			if (subParts) parts.push(subParts);
			return parts.join(" ") || "-";
		}
	};

	// ตรวจสอบสถานะผู้เสียหาย (ไม่มี Emoji)
	let victimStatusStr = "ไม่คัดกรองสถานะ";
	let victimColorClass = "text-[#a16207] bg-[#fef9c3] border-[#facc15]";

	if (data.is_victim === "YES") {
		victimStatusStr = "เป็นผู้เสียหาย";
		victimColorClass = "text-[#b91c1c] bg-[#fee2e2] border-[#f87171]";
	} else if (data.is_victim === "NO") {
		victimStatusStr = "ไม่เป็นผู้เสียหาย";
		victimColorClass = "text-[#15803d] bg-[#dcfce7] border-[#4ade80]";
	}

	return (
		<div
			className="relative mb-6 flex w-full flex-col overflow-hidden rounded-xl font-sans text-[#002f6c] shadow-sm"
			style={{
				minHeight: "520px",
				backgroundColor: "#eef2f5",
				border: "1px solid #d1d5db",
				maxWidth: "800px",
				margin: "0 auto",
			}}
		>
			<div className="flex w-full shrink-0 items-center bg-[#0047a5] px-[4%] py-[2%] text-white">
				<div className="flex flex-col">
					<span className="leading-tight font-bold tracking-wide" style={{ fontSize: "26px" }}>
						{isIllegal ? "บันทึกข้อมูลผู้ลักลอบเข้าประเทศ" : "บันทึกข้อมูลผู้ถูกส่งตัวกลับ"}
					</span>
					<span className="opacity-80" style={{ fontSize: "14px" }}>
						IMMIGRATION RECORD
					</span>
				</div>
				<div className="ml-auto text-right">
					<span className="font-bold opacity-90" style={{ fontSize: "20px" }}>
						{data.national_id ? formatNationalId(data.national_id) : "-"}
					</span>
				</div>
			</div>

			<div className="flex flex-1 bg-[#f3f4f6] p-[4%]">
				<div className="flex min-w-0 flex-1 flex-col justify-between pr-[3%]">
					<div className="flex w-full gap-2">
						<div className="w-1/2">
							<InfoItem label="ชื่อ-นามสกุล / Name (TH)" value={fullNameTh} />
						</div>
						<div className="w-1/2">
							<InfoItem label="Name (EN)" value={fullNameEn} />
						</div>
					</div>

					<div className="mt-2 flex w-full gap-2">
						<div className="w-[35%]">
							<InfoItem label="เกิดวันที่ / Date of Birth" value={getDobText()} />
						</div>
						<div className="w-[20%]">
							<InfoItem label="เพศ / Sex" value={data.gender} />
						</div>
						<div className="w-[45%]">
							<InfoItem label="หนังสือเดินทาง / Passport No." value={data.passport_id} />
						</div>
					</div>

					<div className="mt-2 flex w-full gap-2">
						<div className="w-full">
							<div className="flex min-w-0 flex-col items-start">
								<span className="font-bold text-[#0047a5]" style={{ fontSize: "14px" }}>
									สัญชาติ / Nationality
								</span>
								<div className="mt-0.5 flex items-center gap-1.5">
									{flagUrl && (
										<Base64Image
											src={getDirectImageUrl(flagUrl)}
											alt="flag"
											crossOrigin="anonymous"
											className="h-3.5 w-5 rounded-xs object-cover shadow-sm"
											height={14}
											width={20}
										/>
									)}
									<span
										className="font-bold wrap-break-word whitespace-normal text-[#002f6c]"
										style={{ fontSize: "16px" }}
									>
										{data.nationality || "-"}
									</span>
								</div>
							</div>
						</div>
					</div>

					<div className="mt-2 flex w-full gap-2">
						<div className="w-full">
							<InfoItem
								label={isIllegal ? "สถานที่ / Location" : "ที่อยู่ / Address"}
								value={getLocationText()}
							/>
						</div>
					</div>

					<div className="mt-2 flex w-full gap-2">
						<div className="flex w-full min-w-0 flex-col items-start">
							<span className="mb-0.5 font-bold text-[#0047a5]" style={{ fontSize: "14px" }}>
								สถานะผู้เสียหาย / Victim Status
							</span>
							<span
								className={`rounded border px-2 py-0.5 text-center font-bold ${victimColorClass}`}
								style={{ fontSize: "15px" }}
							>
								{victimStatusStr}
							</span>
						</div>
					</div>

					{/* ข้อมูลเพิ่มเติม (Additional Info) */}
					<div className="mt-2 flex w-full shrink-0 gap-2 pb-1">
						<div className="flex w-full min-w-0 flex-col items-start">
							<span className="mb-0.5 font-bold text-[#0047a5]" style={{ fontSize: "14px" }}>
								ข้อมูลเพิ่มเติม / Additional Info
							</span>
							<div
								className="w-full text-[#002f6c]"
								style={{ fontSize: "14px", lineHeight: "1.4" }}
							>
								{isIllegal ?
									<div className="flex w-full flex-col gap-y-1">
										<div className="wrap-break-word whitespace-normal">
											<span className="font-bold">รายละเอียดคัดกรอง:</span>{" "}
											{data.screening_details || "-"}
										</div>
										<div className="wrap-break-word whitespace-normal">
											<span className="font-bold">หมายเหตุ:</span> {data.note || "-"}
										</div>
									</div>
								:	<div className="flex w-full flex-col gap-y-1">
										<div className="flex w-full gap-2">
											<div className="min-w-0 flex-1 wrap-break-word whitespace-normal">
												<span className="font-bold">อาชีพ:</span> {data.job_type || "-"}
												{data.role ? ` (${data.role})` : ""}
											</div>
											<div className="min-w-0 flex-1 wrap-break-word whitespace-normal">
												<span className="font-bold">รายได้/เดือน:</span> {data.salary || "-"}
											</div>
										</div>
										<div className="flex w-full gap-2">
											<div className="min-w-0 flex-1 wrap-break-word whitespace-normal">
												<span className="font-bold">ผู้จ่ายเงิน:</span> {data.paid_by || "-"}
												{data.payment_method ? ` (${data.payment_method})` : ""}
											</div>
											<div className="min-w-0 flex-1 wrap-break-word whitespace-normal">
												<span className="font-bold">คดี/หมายจับ:</span> {data.number_of_case || "0"}{" "}
												/ {data.number_of_warrant || "0"}
											</div>
										</div>
										<div className="flex w-full gap-2">
											<div className="min-w-0 flex-1 wrap-break-word whitespace-normal">
												<span className="font-bold">หน่วยงาน:</span>{" "}
												{data.responsible_agency || "-"}
											</div>
										</div>
									</div>
								}
							</div>
						</div>
					</div>
				</div>

				<div className="flex h-full w-[22%] shrink-0 flex-col items-center justify-start">
					<div
						className="relative flex w-full items-center justify-center overflow-hidden rounded-md border-2 border-[#e2e8f0] bg-[#f8fafc] shadow-sm"
						style={{ aspectRatio: "3/4" }}
					>
						{data.photo_url ?
							<Base64Image
								src={getDirectImageUrl(data.photo_url)}
								alt="Profile"
								className="relative z-10 h-full w-full object-cover"
								referrerPolicy="no-referrer"
								crossOrigin="anonymous"
							/>
						:	<div className="relative z-10 flex h-full w-full flex-col items-center justify-center bg-[#eef6fc]">
								<img
									src={"/passport.png"}
									className="w-[60%] object-contain opacity-40"
									alt="Placeholder"
								/>
							</div>
						}
					</div>

					<div className="mt-auto w-full shrink-0 pt-2 text-center">
						<div className="leading-tight font-bold text-[#0047a5]" style={{ fontSize: "15px" }}>
							{isIllegal ? "วันที่พบตัว" : "วันที่ส่งตัวกลับ"} / Date
						</div>
						<div className="mt-1 font-bold text-[#002f6c]" style={{ fontSize: "18px" }}>
							{dateValue}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function InfoItem({
	label,
	value,
	colorClass,
}: {
	label: string;
	value?: string | number | null;
	colorClass?: string;
}) {
	return (
		<div className="flex w-full min-w-0 flex-col items-start">
			<span className="font-bold text-[#0047a5]" style={{ fontSize: "14px" }}>
				{label}
			</span>
			<span
				className={`mt-0.5 leading-normal font-bold ${colorClass ? colorClass + " rounded border px-2 py-0.5 text-center" : "w-full wrap-break-word whitespace-normal text-[#002f6c]"}`}
				style={{
					fontSize: "16px",
					display: colorClass ? "inline-block" : "block",
					wordBreak: "break-word",
				}}
			>
				{value || "-"}
			</span>
		</div>
	);
}
