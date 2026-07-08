import thaiAddresses from "../data/thai_addresses.json";

export function splitThaiAddress(fullAddress?: string): {
	details: string;
	sub_district: string | null | undefined;
	district: string | null | undefined;
	province: string | null | undefined;
} {
	if (!fullAddress || typeof fullAddress !== "string") {
		return {
			details: "ไม่ระบุ",
			sub_district: null,
			district: null,
			province: null,
		};
	}

	let str = fullAddress.trim();
	let province: string | null | undefined = null,
		district: string | null | undefined = null,
		sub_district: string | null | undefined = null;

	// หา จังหวัด
	const provMatch =
		str.match(/(?:จ\.| จว\.|จังหวัด)\s*([^\s]+)/)
		|| str.match(
			/\s(กรุงเทพมหานคร|กรุงเทพฯ|กทม\.?|เชียงใหม่|ภูเก็ต|โคราช|ชลบุรี)$/
		);
	if (provMatch) {
		province = provMatch[1];
		str = str.replace(provMatch[0], "").trim();
	}

	// หา อำเภอ / เขต
	const distMatch = str.match(/(?:อ\.|อำเภอ|เขต)\s*([^\s]+)/);
	if (distMatch) {
		district = distMatch[1];
		str = str.replace(distMatch[0], "").trim();
	}

	// หา ตำบล / แขวง
	const subMatch = str.match(/(?:ต\.|ตำบล|แขวง)\s*([^\s]+)/);
	if (subMatch) {
		sub_district = subMatch[1];
		str = str.replace(subMatch[0], "").trim();
	}

	if (province) {
		const p = province.replace(/^(จังหวัด|จ\.|จว\.)/, "").trim();
		if (["กทม", "กทม.", "กรุงเทพ", "กรุงเทพมหานคร", "กรุงเทพฯ"].includes(p)) {
			province = "กรุงเทพมหานคร";
		} else if (p === "โคราช") {
			province = "นครราชสีมา";
		} else {
			const found = thaiAddresses.find(
				(addr) => addr.province.includes(p) || p.includes(addr.province)
			);
			if (found) province = found.province;
			else province = p;
		}
	}

	if (district) {
		const d = district.replace(/^(อำเภอ|เขต|อ\.)/, "").trim();
		if (province && thaiAddresses.length > 0) {
			const found = thaiAddresses.find(
				(addr) =>
					addr.province === province
					&& (addr.amphoe.includes(d) || d.includes(addr.amphoe))
			);
			if (found) district = found.amphoe;
			else district = d;
		} else if (thaiAddresses.length > 0) {
			const found = thaiAddresses.find(
				(addr) => addr.amphoe.includes(d) || d.includes(addr.amphoe)
			);
			if (found) district = found.amphoe;
			else district = d;
		} else {
			district = d;
		}
	}

	if (sub_district) {
		const s = sub_district.replace(/^(ตำบล|แขวง|ต\.)/, "").trim();
		if (province && district && thaiAddresses.length > 0) {
			const found = thaiAddresses.find(
				(addr) =>
					addr.province === province
					&& addr.amphoe === district
					&& (addr.district.includes(s) || s.includes(addr.district))
			);
			if (found) sub_district = found.district;
			else sub_district = s;
		} else if (province && thaiAddresses.length > 0) {
			const found = thaiAddresses.find(
				(addr) =>
					addr.province === province
					&& (addr.district.includes(s) || s.includes(addr.district))
			);
			if (found) sub_district = found.district;
			else sub_district = s;
		} else if (thaiAddresses.length > 0) {
			const found = thaiAddresses.find(
				(addr) => addr.district.includes(s) || s.includes(addr.district)
			);
			if (found) sub_district = found.district;
			else sub_district = s;
		} else {
			sub_district = s;
		}
	}

	if (sub_district && (!district || !province) && thaiAddresses.length > 0) {
		const matches = thaiAddresses.filter(
			(addr) => addr.district === sub_district
		);
		if (matches.length > 0) {
			const uniqueDistricts = new Set(matches.map((m) => m.amphoe));
			const uniqueProvinces = new Set(matches.map((m) => m.province));
			if (uniqueDistricts.size === 1 && uniqueProvinces.size === 1) {
				if (!district) district = matches[0]?.amphoe;
				if (!province) province = matches[0]?.province;
			}
		}
	} else if (district && !province && thaiAddresses.length > 0) {
		const matches = thaiAddresses.filter((addr) => addr.amphoe === district);
		if (matches.length > 0) {
			const uniqueProvinces = new Set(matches.map((m) => m.province));
			if (uniqueProvinces.size === 1) {
				province = matches[0]?.province;
			}
		}
	}

	return {
		details: str || "ไม่ระบุ",
		sub_district,
		district,
		province,
	};
}
