"use client";

import { Lock, Palette, Save, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { SubmitEventHandler, useEffect, useState } from "react";
import Swal from "sweetalert2";

import { getClientAuthData } from "@/lib/client/auth";
import { getMe, updatePassword, updateProfile } from "@/lib/service/auth";
export default function UserProfilePage() {
	const [name, setName] = useState("");
	const [color, setColor] = useState("#ffffff");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const fetchUserData = async () => {
			const { token } = getClientAuthData();
			if (!token) {
				router.push("/login");
				return;
			}

			const response = await getMe();
			if (response.success) {
				setName(response.data.name || "");
				setColor(response.data.color || "#ffffff");
			} else {
				console.error("Error from API:", response.message);
				router.push("/login");
			}

			setLoading(false);
		};
		fetchUserData();
	}, [router]);

	const handleUpdateProfile: SubmitEventHandler = async (e) => {
		e.preventDefault();
		const { token } = getClientAuthData();
		if (!token) {
			Swal.fire({
				icon: "error",
				title: "Token Expired",
				text: "Token expired. Please login again.",
			});
			router.push("/login");
			return;
		}

		const response = await updateProfile({ name, color });

		if (response.success) {
			Swal.fire({
				icon: "success",
				title: "สำเร็จ!",
				text: "อัปเดตโปรไฟล์เรียบร้อยแล้ว",
				timer: 1500,
				showConfirmButton: false,
			});
			window.location.reload();
		} else {
			Swal.fire({
				icon: "error",
				title: "เกิดข้อผิดพลาด",
				text: `เกิดข้อผิดพลาดในการอัปเดตข้อมูล: ${response.message || "Unknown error"}`,
			});
		}
	};

	const handleChangePassword: SubmitEventHandler = async (e) => {
		e.preventDefault();
		const { token } = getClientAuthData();
		if (!token) {
			Swal.fire({
				icon: "error",
				title: "Token Expired",
				text: "Token expired. Please login again.",
			});
			router.push("/login");
			return;
		}

		const response = await updatePassword({ password });

		if (response.success) {
			Swal.fire({
				icon: "success",
				title: "สำเร็จ!",
				text: "เปลี่ยนรหัสผ่านสำเร็จ",
				timer: 1500,
				showConfirmButton: false,
			});
			setPassword("");
		} else {
			Swal.fire({
				icon: "error",
				title: "เกิดข้อผิดพลาด",
				text: `เปลี่ยนรหัสผ่านไม่สำเร็จ: ${response.message || "Unknown error"}`,
			});
		}
	};

	if (loading) {
		return <div className="text-foreground p-10 text-center">กำลังโหลด...</div>;
	}

	return (
		<div className="bg-background min-h-screen p-8">
			<div className="mx-auto max-w-2xl space-y-8">
				<h1 className="text-3xl font-bold text-(--header)">จัดการโปรไฟล์ผู้ใช้งาน</h1>

				{/* Form อัปเดตข้อมูลทั่วไป */}
				<form
					onSubmit={handleUpdateProfile}
					className="space-y-4 rounded-2xl border border-(--shadow) bg-(--container) p-6 shadow-lg"
				>
					<h2 className="text-foreground mb-4 flex items-center gap-2 border-b border-(--shadow) pb-2 text-xl font-semibold">
						<UserIcon size={20} /> ข้อมูลทั่วไป
					</h2>

					<div>
						<label className="text-foreground mb-1 block text-sm">ชื่อผู้ใช้งาน</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="text-foreground w-full rounded-lg border border-(--shadow) bg-(--button) px-4 py-2"
							required
						/>
					</div>

					<div>
						<label className="text-foreground mb-1 block items-center gap-2 text-sm">
							<Palette size={16} /> สีประจำตัว (Profile Color)
						</label>
						<div className="flex items-center gap-4">
							<input
								type="color"
								value={color}
								onChange={(e) => setColor(e.target.value)}
								className="h-10 w-16 cursor-pointer rounded border border-(--shadow) bg-(--button) p-1"
							/>
							<span className="text-foreground uppercase opacity-70">{color}</span>
						</div>
					</div>

					<button
						type="submit"
						className="flex items-center gap-2 rounded-lg bg-(--orangeBG) px-6 py-2 text-white hover:opacity-90"
					>
						<Save size={18} /> บันทึกข้อมูล
					</button>
				</form>

				{/* Form เปลี่ยนรหัสผ่าน */}
				<form
					onSubmit={handleChangePassword}
					className="space-y-4 rounded-2xl border border-(--shadow) bg-(--container) p-6 shadow-lg"
				>
					<h2 className="text-foreground mb-4 flex items-center gap-2 border-b border-(--shadow) pb-2 text-xl font-semibold">
						<Lock size={20} /> เปลี่ยนรหัสผ่าน
					</h2>

					<div>
						<label className="text-foreground mb-1 block text-sm">รหัสผ่านใหม่</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="text-foreground w-full rounded-lg border border-(--shadow) bg-(--button) px-4 py-2"
							placeholder="กรอกรหัสผ่านใหม่"
							required
							minLength={6}
						/>
					</div>

					<button
						type="submit"
						className="flex items-center gap-2 rounded-lg bg-red-500 px-6 py-2 text-white hover:bg-red-600"
					>
						<Save size={18} /> อัปเดตรหัสผ่าน
					</button>
				</form>
			</div>
		</div>
	);
}
