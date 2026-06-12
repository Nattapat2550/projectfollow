export async function getDeportData(
	page: number = 0,
	limit: number = 25
): Promise<{
	data: any[]; 
	total: number;
}> {
	try {
		const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
		const response = await fetch(`${backendUrl}/api/v1/immigrants`, {
			cache: 'no-store'
		});

		if (!response.ok) {
			throw new Error("Failed to fetch deport data");
		}

		const result = await response.json();
		const rawData = result.data?.deporteds || [];

		// Map ข้อมูลให้ตรงกับ UI
		const mappedData = rawData.map((item: any) => {
			
			// จัดการแปลงวันเกิด (จาก String 12/05/2535 เป็นตัวเลข วัน/เดือน/ปี ตาม UI)
			let birth_day = 1, birth_month = 0, birth_year = 2000;
			if (item.date_of_birth && item.date_of_birth.includes('/')) {
				const parts = item.date_of_birth.split('/');
				birth_day = parseInt(parts[0]) || 1;
				birth_month = (parseInt(parts[1]) || 1) - 1; // JavaScript month index (0-11)
				birth_year = parseInt(parts[2]) || 2000;
				// ถ้าเป็น พ.ศ. ให้แปลงเป็น ค.ศ.
				if (birth_year > 2500) birth_year -= 543; 
			}

			return {
				id: item.id,
				first_name_th: item.first_name_th || "ไม่ระบุ",
				middle_name_th: item.middle_name_th || null,
				last_name_th: item.last_name_th || "ไม่ระบุ",
				first_name_en: item.first_name_en || null,
				middle_name_en: item.middle_name_en || null,
				last_name_en: item.last_name_en || null,
				
				gender: "male", // ค่า Default เนื่องจากตาราง deported ไม่มีคอลัมน์เพศ
				national_id: item.national_id || "ไม่ระบุ",
				passport_id: item.passport_id || null,
				
				birth_day,
				birth_month,
				birth_year,
				
				address: item.address || "ไม่ระบุ",
				image_url: item.photo_url || null, // นำรูปภาพที่ฝากบน Drive มาใช้
				
				number_of_case: item.number_of_case || 0,
				number_of_warrant: item.number_of_warrant || 0,
				
				// สกัดข้อมูลเหยื่อ
				is_victim: item.victim_indicator ? item.victim_indicator.includes("มีข้อบ่งชี้") : null,
			};
		});

		const offset = page * limit;
		return {
			data: mappedData.slice(offset, offset + limit),
			total: mappedData.length,
		};
	} catch (error) {
		console.error("Error fetching deport data:", error);
		return { data: [], total: 0 };
	}
}

export async function getSingleDeportData(
	id: string
): Promise<any | null> {
	const { data } = await getDeportData(0, 10000);
	return data.find((deport: any) => deport.id === id) ?? null;
}