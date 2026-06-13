export async function getImmigrantData(
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
			throw new Error("Failed to fetch immigrant data");
		}

		const result = await response.json();
		const rawData = result.data?.illegals || [];

		const mappedData = rawData.map((item: any) => ({
			id: item.id,
			first_name: item.first_name_th || item.first_name_en || "ไม่ระบุ",
			middle_name: item.middle_name_th || item.middle_name_en || null,
			last_name: item.last_name_th || item.last_name_en || "ไม่ระบุ",
			
			gender: item.gender === "หญิง" ? "female" : "male", 
			
			nationality: item.nationality || "ไม่ระบุ",
			passport_id: item.passport_id || null,
			detected_location: item.detected_location || "ไม่ระบุสถานที่",
			detected_date: item.detected_date ? new Date(item.detected_date).toISOString() : null,
			is_victim: item.is_victim ?? null,
			image_url: item.photo_url || null, // นำรูปภาพที่ฝากบน Drive มาใช้
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
	const { data } = await getImmigrantData(0, 10000);
	return data.find((immigrant: any) => immigrant.id === id) ?? null;
}