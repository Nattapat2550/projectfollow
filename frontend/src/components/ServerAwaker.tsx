"use client";

import React, { useState, useEffect } from "react";
import { Loader2, ServerCrash } from "lucide-react";

export default function ServerAwaker({
	children,
}: {
	children: React.ReactNode;
}) {
	const [isServerAlive, setIsServerAlive] = useState<boolean | null>(null);
	const [retryCount, setRetryCount] = useState(0);

	// 🟢 แก้ไข: เปลี่ยนไปปิงที่ Root URL (หน้าแรกสุด) ของ Backend แทนที่จะเป็น /auth/me
	// เพื่อหลีกเลี่ยง Error 401 Unauthorized กวนใจใน Console
	const API_PING_URL =
		process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

	useEffect(() => {
		let intervalId: NodeJS.Timeout;

		const checkServerStatus = async () => {
			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 4000); // ตั้งเวลา Timeout แค่ 4 วิ

				// ยิงไปที่ Base URL เฉยๆ เพื่อเช็คว่าเซิร์ฟเวอร์ตอบสนองไหม
				const res = await fetch(API_PING_URL, {
					method: "GET",
					signal: controller.signal,
				});

				clearTimeout(timeoutId);

				// ถ้า Backend ส่งอะไรกลับมา (เช่น 200 OK หรือ 404 Not Found) แปลว่าเซิร์ฟเวอร์ตื่นแล้ว
				if (res) {
					setIsServerAlive(true);
				}
			} catch (error) {
				// กรณี Network Error (เซิร์ฟเวอร์หลับ/ยังไม่เปิด) จะหลุดมาที่นี่
				setRetryCount((prev) => prev + 1);
				setIsServerAlive(false);
			}
		};

		if (isServerAlive !== true) {
			checkServerStatus();
			// ยิงเช็คสถานะและปลุกเซิร์ฟเวอร์ทุกๆ 3.5 วินาที
			intervalId = setInterval(checkServerStatus, 3500);
		}

		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	}, [isServerAlive]);

	if (isServerAlive === null) {
		return (
			<div className="bg-background flex h-screen w-full flex-col items-center justify-center space-y-4 p-6">
				<Loader2 className="h-12 w-12 animate-spin text-blue-500" />
				<div className="text-muted-foreground animate-pulse font-medium">
					กำลังโหลดระบบ...
				</div>
			</div>
		);
	}

	if (isServerAlive === false) {
		return (
			<div className="bg-background flex h-screen w-full flex-col items-center justify-center p-6 transition-all duration-300">
				<div className="w-full max-w-md space-y-6 rounded-2xl border border-(--wrapper) bg-(--container) p-8 text-center shadow-xl">
					<div className="relative flex items-center justify-center">
						<div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
						<ServerCrash className="h-8 w-8 animate-pulse text-blue-500" />
					</div>

					<div className="space-y-2">
						<h2 className="text-foreground text-xl font-bold">
							กำลังปลุกระบบหลังบ้าน (Backend)
						</h2>
						<p className="text-muted-foreground px-4 text-sm">
							ระบบกำลังเริ่มทำงานเนื่องจากไม่มีการใช้งานชั่วคราวบน Cloud
							อาจใช้เวลาประมาณ 30-50 วินาที โปรดรอสักครู่...
						</p>
					</div>

					<div className="bg-muted/50 space-y-1 rounded-xl border border-(--wrapper) p-3 text-left font-mono text-xs">
						<div className="text-muted-foreground flex justify-between">
							<span>สถานะเซิร์ฟเวอร์:</span>
							<span className="animate-pulse font-semibold text-amber-500">
								Waking Up...
							</span>
						</div>
						<div className="text-muted-foreground flex justify-between">
							<span>ยิงคำขอเพื่อปลุกแล้ว:</span>
							<span>{retryCount} ครั้ง</span>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
