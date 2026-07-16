"use client";

import { Eye, EyeOff, Lock, User } from "lucide-react";
import React, { useState } from "react";
import Swal from "sweetalert2";

import { login } from "@/lib/service/auth";

import { InputField } from "./InputField";
import { SubmitButton } from "./SubmitButton";

const LoginForm = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		const response = await login({ name: username, password });

		if (response.success) {
			await Swal.fire({
				icon: "success",
				title: "เข้าสู่ระบบสำเร็จ!",
				showConfirmButton: false,
				timer: 1500,
			});

			// ✨ ตรวจสอบว่ามี callbackUrl (หน้าก่อนหน้าที่ถูกเด้งมา) อยู่ใน Address Bar หรือไม่
			const searchParams = new URLSearchParams(window.location.search);
			const callbackUrl = searchParams.get("callbackUrl");

			// ถ้ามี URL เดิมติดมาด้วย ให้พากลับไปหน้าเดิม แต่ถ้าไม่มีให้พากลับหน้า /dashboard
			const decodedUrl = decodeURIComponent(callbackUrl || "");
			if (decodedUrl && decodedUrl.startsWith("/") && !decodedUrl.startsWith("//")) {
				window.location.href = decodedUrl;
			} else {
				window.location.href = "/dashboard";
			}
		} else {
			Swal.fire({
				icon: "error",
				title: "เข้าสู่ระบบไม่สำเร็จ",
				text: response.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
			});
		}
		setLoading(false);
	};

	return (
		<div className="mx-auto mt-20 flex w-full max-w-md flex-col gap-2 rounded-2xl border-2 border-(--shadow) bg-(--container) p-8 shadow-lg transition-all">
			<div className="mb-8 text-center">
				<h1 className="mb-2 text-3xl font-bold text-(--header)">ยินดีต้อนรับ</h1>
				<p className="text-foreground opacity-70">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
			</div>

			<form onSubmit={handleLogin} className="space-y-6">
				<InputField
					label="ชื่อผู้ใช้งาน"
					icon={<User size={16} />}
					type="text"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					placeholder="กรอกชื่อผู้ใช้งาน"
					required
				/>

				<InputField
					label="รหัสผ่าน"
					icon={<Lock size={16} />}
					type={showPassword ? "text" : "password"}
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="กรอกรหัสผ่าน"
					required
					rightElement={
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="text-foreground cursor-pointer opacity-50 transition-opacity hover:opacity-100"
						>
							{showPassword ?
								<EyeOff size={20} />
							:	<Eye size={20} />}
						</button>
					}
				/>

				<SubmitButton loading={loading} loadingText="กำลังเข้าสู่ระบบ...">
					เข้าสู่ระบบ
				</SubmitButton>
			</form>
		</div>
	);
};

export default LoginForm;
