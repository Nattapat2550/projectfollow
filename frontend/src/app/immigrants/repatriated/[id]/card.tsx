import Image from "next/image";
import React from "react";

import { COUNTRY_MAP } from "@/constants/country";
import { getValidImageUrl } from "@/lib/imageUrl";

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

export default function RepatriatedIDPageCard({ data }: { data: RepatriatedData | null }) {
	if (!data) return null;

	const flagUrl = data.nationality ? getFlagUrl(data.nationality) : null;

	// แยกชื่อ ไทย-อังกฤษ
	const fullNameTh =
		`${data.first_name_th || ""}${data.middle_name_th ? " " + data.middle_name_th : ""} ${data.last_name_th || ""}`.trim();
	const fullNameEn =
		data.first_name_en ?
			`${data.first_name_en}${data.middle_name_en ? " " + data.middle_name_en : ""} ${data.last_name_en ?? ""}`.trim()
		:	"";

	// วันที่พบตัว / ส่งกลับ
	const dateValue = formatDate(data.return_date);

	// วันเดือนปีเกิด
	const getDobText = () => {
		if (data.date_of_birth) {
			return formatDate(data.date_of_birth);
		}
		return "-";
	};

	// ข้อมูลสถานที่ / ที่อยู่
	const getLocationText = () => {
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
			className="relative w-full overflow-hidden rounded-2xl border border-[#9DD8BE] bg-[#DFF5EC] pt-[6%] font-sans shadow-md"
			style={{ aspectRatio: "856 / 540" }}
		>
			{/* Header ตรงกลางด้านบน */}
			<div className="absolute top-[3%] left-0 w-full text-center">
				<p
					className="font-bold tracking-wide text-[#022c22]"
					style={{ fontSize: "clamp(12px, 2.8vw, 24px)" }}
				>
					{"ผู้ถูกส่งตัวกลับ"}
				</p>
			</div>

			<div className="absolute inset-0 top-[11%] flex p-[4%] pt-0">
				{/* คอลัมน์ซ้าย (รายละเอียดข้อมูล) */}
				<div className="flex min-w-0 flex-col" style={{ width: "67%", marginRight: "3%" }}>
					{/* แถว 1: ชื่อ-นามสกุล (แยกกล่อง ไทย - อังกฤษ) */}
					<div className="flex w-full justify-between" style={{ marginBottom: "2%" }}>
						<div className="flex flex-col" style={{ width: "48.5%" }}>
							<ILabel>ชื่อ - นามสกุล</ILabel>
							<IBox>{fullNameTh || "-"}</IBox>
						</div>
						<div className="flex flex-col" style={{ width: "48.5%" }}>
							<ILabel>Name</ILabel>
							<IBox>{fullNameEn || "-"}</IBox>
						</div>
					</div>

					{/* แถว 2: เลขที่บัตร */}
					<div className="flex w-full justify-between" style={{ marginBottom: "2%" }}>
						<div className="flex flex-col" style={{ width: "48.5%" }}>
							<ILabel>เลขประจำตัวประชาชน</ILabel>
							<IBox mono>{formatNationalId(data.national_id) || "-"}</IBox>
						</div>
						<div className="flex flex-col" style={{ width: "48.5%" }}>
							<ILabel>เลขที่หนังสือเดินทาง (Passport ID)</ILabel>
							<IBox mono>{data.passport_id || "-"}</IBox>
						</div>
					</div>

					{/* แถว 3: วันเกิด / เพศ-อายุ / สัญชาติ */}
					<div className="flex w-full" style={{ marginBottom: "2%" }}>
						<div className="flex flex-col" style={{ width: "37.6%", marginRight: "3%" }}>
							<ILabel>วันเดือนปีเกิด / DOB</ILabel>
							<IBox>{getDobText()}</IBox>
						</div>
						<div className="flex flex-col" style={{ width: "25.1%", marginRight: "3%" }}>
							<ILabel>เพศ/อายุ</ILabel>
							<IBox>{data.gender || "-"}</IBox>
						</div>
						<div className="flex flex-col" style={{ width: "31.3%" }}>
							<ILabel>สัญชาติ</ILabel>
							<IBox>
								<div className="flex items-center gap-1.5">
									{flagUrl && (
										<Image
											src={flagUrl}
											alt="flag"
											crossOrigin="anonymous"
											className="h-3.25 w-4.5 rounded-xs object-cover shadow-sm"
											width={13}
											height={18}
										/>
									)}
									<span className="truncate">{data.nationality || "-"}</span>
								</div>
							</IBox>
						</div>
					</div>

					{/* แถว 4: สถานที่ */}
					<div className="flex flex-col" style={{ marginBottom: "2%" }}>
						<ILabel>ที่อยู่ปัจจุบันตามบันทึก</ILabel>
						<IBox noTruncate className="w-full justify-start! text-left">
							<div className="w-full truncate">{getLocationText()}</div>
						</IBox>
					</div>

					{/* แถว 5: ข้อมูลอื่นๆ ทั้งหมดจาก Structure.md */}
					<div className="mb-1 flex flex-1 flex-col">
						<ILabel>ข้อมูลเพิ่มเติม (Additional Info)</ILabel>
						<IBox noTruncate className="h-full justify-start! overflow-hidden text-left">
							<div className="flex w-full flex-col gap-y-1.5" style={{ fontSize: "0.85em" }}>
								<div className="wrap-break-word">
									<span className="font-semibold text-[#022c22]">อาชีพ:</span>{" "}
									{data.job_type || "-"}
									{data.role ? ` (${data.role})` : ""}
								</div>
								<div className="wrap-break-word">
									<span className="font-semibold text-[#022c22]">รายได้/เดือน:</span>{" "}
									{data.salary || "-"}
								</div>
								<div className="wrap-break-word">
									<span className="font-semibold text-[#022c22]">ผู้จ่ายเงิน:</span>{" "}
									{data.paid_by || "-"}
									{data.payment_method ? ` (${data.payment_method})` : ""}
								</div>
								<div className="wrap-break-word">
									<span className="font-semibold text-[#022c22]">คดี/หมายจับ:</span>{" "}
									{data.number_of_case || "0"} / {data.number_of_warrant || "0"}
								</div>
								<div className="wrap-break-word">
									<span className="font-semibold text-[#022c22]">หน่วยงาน:</span>{" "}
									{data.responsible_agency || "-"}
								</div>
								{(data.is_victim === "YES" || data.is_victim === "NO") && (
									<div className="wrap-break-word">
										<span className="font-semibold text-[#022c22]">สถานะผู้เสียหาย:</span>{" "}
										{data.is_victim === "YES" ? "เป็นผู้เสียหาย" : "ไม่เป็นผู้เสียหาย"}
									</div>
								)}
								<div className="wrap-break-word">
									<span className="font-semibold text-[#022c22]">รายละเอียดคัดกรอง:</span>{" "}
									{data.screening_details || "-"}
								</div>

								<div className="wrap-break-word">
									<span className="font-semibold text-[#022c22]">หมายเหตุ:</span> {data.note || "-"}
								</div>
							</div>
						</IBox>
					</div>
				</div>

				{/* คอลัมน์ขวา (รูปภาพ ไว้ฝั่งขวา) */}
				<div className="flex shrink-0 flex-col items-center" style={{ width: "30%" }}>
					<div
						className="relative mb-[5%] flex w-full items-end justify-center overflow-hidden rounded-xl border border-[#a7f3d0] bg-white shadow-inner"
						style={{ aspectRatio: "3/4" }}
					>
						{data.photo_url ?
							<Image
								src={getValidImageUrl(data.photo_url)}
								alt="Profile"
								className="h-full w-full object-cover"
								fill
								preload
							/>
						:	<div className="flex h-full w-full flex-col items-center justify-end pb-[8%]">
								<Image
									src={"/enter.png"}
									className="w-1/2 object-contain opacity-40"
									alt="Placeholder"
									fill
								/>
							</div>
						}
					</div>

					{/* ป้ายสถานะผู้เสียหาย (ไม่มี Emoji) */}
					<span
						className={`w-full text-center ${victimColorClass} mb-[5%] flex items-center justify-center rounded-full border px-2 py-1 font-bold`}
						style={{ fontSize: "clamp(8px, 1.1vw, 12px)" }}
					>
						<span>{victimStatusStr}</span>
					</span>

					{/* วันที่พบตัว (โชว์เด่นๆ ฝั่งขวาใต้รูป) */}
					<div className="flex w-full flex-col items-center">
						<div style={{ marginBottom: "4px" }}>
							<ILabel>{"วันที่ส่งตัวกลับ"}</ILabel>
						</div>
						<IBox className="flex w-full justify-center text-center font-bold">{dateValue}</IBox>
					</div>
				</div>
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------
// Styled Components ภายใน
// ----------------------------------------------------------------------
function ILabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
	return (
		<span
			className={`mb-0.5 block font-bold text-[#022c22] ${className}`}
			style={{ fontSize: "clamp(5px, 1.2vw, 11px)" }}
		>
			{children}
		</span>
	);
}

function IBox({
	children,
	mono = false,
	noTruncate = false,
	className = "",
}: {
	children: React.ReactNode;
	mono?: boolean;
	noTruncate?: boolean;
	className?: string;
}) {
	return (
		<div
			className={`rounded-md bg-[#B8E8D4] font-medium text-[#064e3b] ${mono ? "font-mono tracking-tight" : ""} ${noTruncate ? "flex flex-col justify-center" : "truncate"} ${className}`}
			style={{
				fontSize: "clamp(6px, 1.3vw, 12px)",
				padding: "0.5em 0.8em",
			}}
		>
			{children}
		</div>
	);
}
