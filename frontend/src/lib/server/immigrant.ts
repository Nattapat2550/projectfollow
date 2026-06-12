
export async function getImmigrantData(
	page: number = 0,
	limit: number = 25
): Promise<{
	data: any[]; // หรือใส่เป็น ImmigrantData[]
	total: number;
}> {
	try {
		// ดึง URL Backend จาก Env ถ้าไม่มีให้ใช้ localhost:8000
		const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
		
		// เรียก API ดึงข้อมูล
		const response = await fetch(`${backendUrl}/api/v1/immigrants`, {
			cache: 'no-store' // ไม่ทำ Cache เพื่อให้ดึงข้อมูลอัปเดตใหม่เสมอ
		});

		if (!response.ok) {
			throw new Error("Failed to fetch immigrant data");
		}

		const result = await response.json();
		const rawData = result.data?.illegals || [];

		// Map ข้อมูลจาก Database ให้ตรงกับคอลัมน์ของ Frontend
		const mappedData = rawData.map((item: any) => ({
			id: item.id,
			first_name: item.first_name_th || item.first_name_en || "ไม่ระบุ",
			middle_name: item.middle_name_th || item.middle_name_en || null,
			last_name: item.last_name_th || item.last_name_en || "ไม่ระบุ",
			
			// แปลงเพศกลับเป็น male/female ตามที่ UI ต้องการ
			gender: item.gender === "หญิง" ? "female" : "male", 
			
			nationality: item.nationality || "ไม่ระบุ",
			passport_id: item.passport_id || null,
			detected_location: item.detected_location || "ไม่ระบุสถานที่",
			detected_date: item.detected_date ? new Date(item.detected_date).toISOString() : null,
			is_victim: item.is_victim ?? null,
		}));

		const offset = page * limit;
		return {
			data: mappedData.slice(offset, offset + limit),
			total: mappedData.length,
		};
	} catch (error) {
		console.error("Error fetching immigrant data:", error);
		return { data: [], total: 0 };
	}
}

export async function getSingleImmigrantData(
	id: string
): Promise<any | null> {
	// ดึงข้อมูลทั้งหมดมาแล้วหา id ที่ตรงกัน (หรือถ้าใน Backend มี API /:id ก็สามารถยิงตรงได้เลย)
	const { data } = await getImmigrantData(0, 10000);
	return data.find((immigrant: any) => immigrant.id === id) ?? null;
}