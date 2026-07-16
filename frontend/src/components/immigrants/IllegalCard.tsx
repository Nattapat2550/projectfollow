import React, { useState, useEffect } from "react";

interface IllegalCardProps {
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

// ----------------------------------------------------------------------
// ฐานข้อมูลสัญชาติ - รหัสประเทศ (ครอบคลุมทั่วโลก ไทย/อังกฤษ/คำย่อ)
// ----------------------------------------------------------------------
const COUNTRY_MAP: { [key: string]: string } = {
	// อาเซียน & เอเชียตะวันออก
	ไทย: "th",
	thai: "th",
	thailand: "th",
	พม่า: "mm",
	เมียนมา: "mm",
	myanmar: "mm",
	burma: "mm",
	ลาว: "la",
	laos: "la",
	lao: "la",
	กัมพูชา: "kh",
	เขมร: "kh",
	cambodia: "kh",
	เวียดนาม: "vn",
	vietnam: "vn",
	มาเลเซีย: "my",
	malaysia: "my",
	สิงคโปร์: "sg",
	singapore: "sg",
	อินโดนีเซีย: "id",
	indonesia: "id",
	ฟิลิปปินส์: "ph",
	philippines: "ph",
	บรูไน: "bn",
	brunei: "bn",
	ติมอร์: "tl",
	timor: "tl",
	จีน: "cn",
	china: "cn",
	ไต้หวัน: "tw",
	taiwan: "tw",
	ญี่ปุ่น: "jp",
	japan: "jp",
	เกาหลีใต้: "kr",
	"south korea": "kr",
	korea: "kr",
	เกาหลีเหนือ: "kp",
	"north korea": "kp",
	ฮ่องกง: "hk",
	"hong kong": "hk",
	มาเก๊า: "mo",
	macau: "mo",

	// เอเชียใต้ & ตะวันออกกลาง
	อินเดีย: "in",
	india: "in",
	บังกลาเทศ: "bd",
	bangladesh: "bd",
	ปากีสถาน: "pk",
	pakistan: "pk",
	ศรีลังกา: "lk",
	"sri lanka": "lk",
	เนปาล: "np",
	nepal: "np",
	ภูฏาน: "bt",
	bhutan: "bt",
	มัลดีฟส์: "mv",
	maldives: "mv",
	อัฟกานิสถาน: "af",
	afghanistan: "af",
	อิหร่าน: "ir",
	iran: "ir",
	อิรัก: "iq",
	iraq: "iq",
	ซาอุดีอาระเบีย: "sa",
	ซาอุ: "sa",
	"saudi arabia": "sa",
	ยูเออี: "ae",
	สหรัฐอาหรับเอมิเรตส์: "ae",
	uae: "ae",
	"united arab emirates": "ae",
	อิสราเอล: "il",
	israel: "il",
	ตุรกี: "tr",
	turkey: "tr",
	ซีเรีย: "sy",
	syria: "sy",
	กาตาร์: "qa",
	qatar: "qa",
	คูเวต: "kw",
	kuwait: "kw",
	จอร์แดน: "jo",
	jordan: "jo",
	เลบานอน: "lb",
	lebanon: "lb",
	โอมาน: "om",
	oman: "om",
	เยเมน: "ye",
	yemen: "ye",

	// ยุโรป
	อังกฤษ: "gb",
	สหราชอาณาจักร: "gb",
	uk: "gb",
	"united kingdom": "gb",
	england: "gb",
	britain: "gb",
	ฝรั่งเศส: "fr",
	france: "fr",
	เยอรมนี: "de",
	เยอรมัน: "de",
	germany: "de",
	อิตาลี: "it",
	italy: "it",
	สเปน: "es",
	spain: "es",
	โปรตุเกส: "pt",
	portugal: "pt",
	เนเธอร์แลนด์: "nl",
	ฮอลแลนด์: "nl",
	netherlands: "nl",
	holland: "nl",
	เบลเยียม: "be",
	belgium: "be",
	สวิตเซอร์แลนด์: "ch",
	สวิส: "ch",
	switzerland: "ch",
	swiss: "ch",
	ออสเตรีย: "at",
	austria: "at",
	สวีเดน: "se",
	sweden: "se",
	นอร์เวย์: "no",
	norway: "no",
	เดนมาร์ก: "dk",
	denmark: "dk",
	ฟินแลนด์: "fi",
	finland: "fi",
	รัสเซีย: "ru",
	russia: "ru",
	ยูเครน: "ua",
	ukraine: "ua",
	โปแลนด์: "pl",
	poland: "pl",
	กรีซ: "gr",
	greece: "gr",
	ไอร์แลนด์: "ie",
	ireland: "ie",
	เช็ก: "cz",
	czech: "cz",
	ฮังการี: "hu",
	hungary: "hu",
	โรมาเนีย: "ro",
	romania: "ro",

	// อเมริกาเหนือและใต้
	สหรัฐอเมริกา: "us",
	อเมริกา: "us",
	usa: "us",
	"united states": "us",
	america: "us",
	แคนาดา: "ca",
	canada: "ca",
	เม็กซิโก: "mx",
	mexico: "mx",
	บราซิล: "br",
	brazil: "br",
	อาร์เจนตินา: "ar",
	argentina: "ar",
	โคลอมเบีย: "co",
	colombia: "co",
	ชิลี: "cl",
	chile: "cl",
	เปรู: "pe",
	peru: "pe",
	คิวบา: "cu",
	cuba: "cu",

	// แอฟริกา
	แอฟริกาใต้: "za",
	"south africa": "za",
	อียิปต์: "eg",
	egypt: "eg",
	ไนจีเรีย: "ng",
	nigeria: "ng",
	เคนยา: "ke",
	kenya: "ke",
	โมร็อกโก: "ma",
	morocco: "ma",
	เอธิโอเปีย: "et",
	ethiopia: "et",
	กานา: "gh",
	ghana: "gh",

	// โอเชียเนีย
	ออสเตรเลีย: "au",
	australia: "au",
	นิวซีแลนด์: "nz",
	"new zealand": "nz",
	ฟิจิ: "fj",
	fiji: "fj",
	ปาปัวนิวกินี: "pg",
	"papua new guinea": "pg",
};

// นำ Keys มาเรียงลำดับจาก "คำยาวที่สุด" ไป "สั้นที่สุด" ป้องกันปัญหาคำทับซ้อน (เช่น "เกาหลีใต้" vs "เกาหลี")
const SORTED_COUNTRY_KEYS = Object.keys(COUNTRY_MAP).sort((a, b) => b.length - a.length);

const getFlagUrl = (nationality: string) => {
	if (!nationality) return null;
	const nat = nationality.trim().toLowerCase();

	// วนลูปหาคำที่ตรงกันจากชุดคำที่เรียงความยาวไว้แล้ว
	const foundKey = SORTED_COUNTRY_KEYS.find((key) => nat.includes(key));

	return foundKey ? `https://flagcdn.com/w40/${COUNTRY_MAP[foundKey]}.png` : null;
};
// ----------------------------------------------------------------------

const Base64Image = ({ src, alt, className, crossOrigin, referrerPolicy }: any) => {
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

export default function IllegalCard({ data, isExporting = false }: IllegalCardProps) {
	const fullNameTh =
		`${data.first_name_th || ""}${data.middle_name_th ? " " + data.middle_name_th : ""} ${data.last_name_th || ""}`.trim();
	const fullNameEn =
		data.first_name_en ?
			`${data.first_name_en}${data.middle_name_en ? " " + data.middle_name_en : ""} ${data.last_name_en ?? ""}`.trim()
		:	"";

	const detectedDateFormatted =
		data.detected_date ?
			new Date(data.detected_date).toLocaleDateString("th-TH", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
			})
		:	"-";

	const flagUrl = getFlagUrl(data.nationality);

	return (
		<div
			className="relative w-full overflow-hidden rounded-2xl border border-[#9DD8BE] bg-[#DFF5EC] font-sans shadow-md"
			style={{ aspectRatio: "856 / 540" }}
		>
			<div className="absolute inset-0 flex gap-[4%] p-[4%]">
				{/* คอลัมน์ซ้าย (รูปภาพและป้ายสัญชาติ) */}
				<div className="flex shrink-0 flex-col items-center" style={{ width: "30%" }}>
					<p
						className="mb-[3%] text-center leading-tight font-bold text-emerald-900"
						style={{ fontSize: "clamp(8px, 2.4vw, 20px)" }}
					>
						ผู้ลักลอบเข้าประเทศ
					</p>

					<span
						className="mb-[5%] flex items-center justify-center gap-1 rounded-full border border-red-200 bg-red-50 font-bold text-red-500"
						style={{ fontSize: "clamp(5px, 1.2vw, 11px)", padding: "1% 8%" }}
					>
						สัญชาติ:
						{flagUrl && (
							<img
								src={flagUrl}
								alt="flag"
								className="h-2.5 w-3.5 rounded-[1px] object-cover shadow-[0_0_2px_rgba(0,0,0,0.2)]"
							/>
						)}
						{data.nationality || "ไม่ระบุ"}
					</span>

					<div
						className="relative flex w-full items-end justify-center overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-inner"
						style={{ aspectRatio: "3/4" }}
					>
						{data.photo_url ?
							<Base64Image
								src={getDirectImageUrl(data.photo_url, data.id || Math.random().toString())}
								alt="Profile"
								className="h-full w-full object-cover"
								referrerPolicy="no-referrer"
							/>
						:	<div className="flex h-full w-full flex-col items-center justify-end pb-[8%]">
								<img src={"/enter.png"} className="opacity-40"></img>
							</div>
						}
					</div>
				</div>

				{/* คอลัมน์ขวา (รายละเอียดข้อมูล) */}
				<div className="flex min-w-0 flex-1 flex-col gap-[4%]">
					<div className="flex gap-[4%]">
						<div className="flex flex-1 flex-col gap-[6%]">
							<ILabel>จากประเทศ</ILabel>
							<IBox>
								<div className="flex items-center gap-1.5">
									{flagUrl && (
										<img
											src={flagUrl}
											alt="flag"
											className="h-3.25 w-4.5 rounded-xs object-cover shadow-[0_0_2px_rgba(0,0,0,0.2)]"
										/>
									)}
									<span>{data.nationality || "-"}</span>
								</div>
							</IBox>
						</div>
						<div className="flex flex-1 flex-col gap-[6%]">
							<ILabel>เลขที่หนังสือเดินทาง</ILabel>
							<IBox mono>{data.passport_id || "-"}</IBox>
						</div>
					</div>

					<div className="flex flex-col gap-[4%]">
						<ILabel>ชื่อ - นามสกุล</ILabel>
						<IBox noTruncate>
							<div className="truncate">{fullNameTh || "ไม่ระบุชื่อ"}</div>
							{fullNameEn && (
								<div className="mt-[0.5%] truncate text-[0.82em] font-normal tracking-wide opacity-75">
									{fullNameEn}
								</div>
							)}
						</IBox>
					</div>

					<div className="flex gap-[4%]">
						<div className="flex flex-col gap-[6%]" style={{ width: "55%" }}>
							<ILabel>สัญชาติ</ILabel>
							<IBox>
								<div className="flex items-center gap-1.5">
									{flagUrl && (
										<img
											src={flagUrl}
											alt="flag"
											className="h-3.25 w-4.5 rounded-xs object-cover shadow-[0_0_2px_rgba(0,0,0,0.2)]"
										/>
									)}
									<span>{data.nationality || "-"}</span>
								</div>
							</IBox>
						</div>
						<div className="flex flex-1 flex-col gap-[6%]">
							<ILabel>เพศ</ILabel>
							<IBox>{data.gender || "-"}</IBox>
						</div>
					</div>

					<div className="flex flex-col gap-[4%]">
						<ILabel>วันที่ตรวจเจอ</ILabel>
						<IBox>{detectedDateFormatted}</IBox>
					</div>
				</div>
			</div>
		</div>
	);
}

function ILabel({ children }: { children: React.ReactNode }) {
	return (
		<span className="font-bold text-emerald-950" style={{ fontSize: "clamp(5px, 1.3vw, 11px)" }}>
			{children}
		</span>
	);
}
function IBox({
	children,
	mono = false,
	noTruncate = false,
}: {
	children: React.ReactNode;
	mono?: boolean;
	noTruncate?: boolean;
}) {
	return (
		<div
			className={`rounded-md bg-[#B8E8D4] font-medium text-emerald-900 ${mono ? "font-mono" : ""} ${noTruncate ? "flex flex-col justify-center" : "truncate"}`}
			style={{
				fontSize: "clamp(6px, 1.5vw, 13px)",
				padding: "4% 6%",
				minHeight: "18%",
			}}
		>
			{children}
		</div>
	);
}
