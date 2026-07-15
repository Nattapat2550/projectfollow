"use client";

import { LogIn, LogOut, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { clearClientAuthData, getClientAuthData } from "@/lib/client/auth";
import { getMe, logout } from "@/lib/server/auth";

import DarkModeBtn from "./DarkModeBtn";

export default function TopBar() {
	const [user, setUser] = useState<{
		id: string;
		name: string;
		color?: string;
	} | null>(null);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const router = useRouter();

	const clearAuthData = () => {
		clearClientAuthData();
		setUser(null);
	};

	// เช็คสถานะ Login
	useEffect(() => {
		const fetchUser = async () => {
			const { user } = getClientAuthData();
			if (user) {
				setUser(user);
				return;
			}

			const response = await getMe();

			if (response.success) {
				setUser(response.data);
			} else {
				clearAuthData();
			}
		};
		fetchUser();
	}, []);

	// ปิด dropdown เมื่อคลิกที่อื่น
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current
				&& !dropdownRef.current.contains(event.target as Node)
			) {
				setDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleLogout = async () => {
		await logout();

		clearAuthData();

		router.push("/login");
		router.refresh(); // บังคับรีเฟรช 1 รอบเพื่อให้ Layout อัปเดตใหม่ทั้งหมด
	};

	return (
		<div
			id="main-topbar"
			className="relative z-50 flex w-full items-center justify-between gap-2 px-4 py-3 shadow-md sm:px-6 sm:py-4"
			style={{ backgroundColor: "var(--header-bg)" }}
		>
			<Link
				href="/"
				aria-label="กลับหน้าหลัก ระบบติดตามงานมอบหมาย"
				className="min-w-0 flex-1 shrink"
			>
				<div className="group flex min-w-0 items-center gap-2 sm:gap-4">
					<Image
						src="/police.png"
						alt="โลโก้ระบบติดตามงานมอบหมาย"
						width={40}
						height={40}
						className="h-8 w-8 shrink-0 transition-transform group-hover:scale-110 sm:h-10 sm:w-10"
						priority
					/>
					<strong className="block truncate text-sm font-bold text-white sm:text-lg lg:text-xl">
						ระบบติดตาม
					</strong>
				</div>
			</Link>

			<div className="flex shrink-0 items-center gap-2 sm:gap-4">
				<DarkModeBtn />

				<Link
					href="/dashboard"
					aria-label="ไปหน้า Dashboard"
					className="flex items-center gap-1 rounded-lg px-2 py-2 transition-colors hover:bg-white/10 sm:gap-2 sm:px-4"
				>
					<span className="hidden font-medium text-white md:inline">
						Dashboard
					</span>
				</Link>

				<Link href="/help" aria-label="ไปหน้าช่วยเหลือการใช้งาน">
					<button className="flex items-center gap-1 rounded-lg px-2 py-2 transition-colors hover:bg-white/10 sm:gap-2 sm:px-4">
						<Image
							src="/window.svg"
							alt="ไอคอนช่วยเหลือ"
							width={24}
							height={24}
							className="h-5 w-5 shrink-0 sm:h-6 sm:w-6"
						/>
						<span className="hidden font-medium text-white md:inline">
							ช่วยเหลือ
						</span>
					</button>
				</Link>

				{user ?
					<div className="relative" ref={dropdownRef}>
						<button
							onClick={() => setDropdownOpen(!dropdownOpen)}
							className="flex max-w-32.5 items-center gap-2 rounded-full border border-(--shadow) bg-(--button) px-2 py-2 transition-all hover:opacity-80 sm:max-w-50 sm:gap-3 sm:px-4"
							style={{
								boxShadow:
									"0 1px 3px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.08)",
							}}
						>
							<Image
								src="/user.png"
								alt="รูปโปรไฟล์ผู้ใช้งาน"
								width={24}
								height={24}
								className="h-6 w-6 shrink-0 rounded-full object-cover"
							/>
							<span className="text-foreground! block truncate text-sm font-medium sm:text-base">
								{user.name}
							</span>
						</button>

						{dropdownOpen && (
							<div className="absolute right-0 mt-2 flex w-48 flex-col overflow-hidden rounded-xl border border-(--shadow) bg-(--container) py-2 shadow-lg">
								<div className="flex items-center gap-2 border-b border-(--shadow) bg-(--button)/40 px-4 py-2">
									<Image
										src="/user.png"
										alt="รูปโปรไฟล์ย่อ"
										width={20}
										height={20}
										className="h-auto shrink-0 rounded-full"
									/>
									<span className="text-foreground! truncate text-xs font-semibold">
										{user.name}
									</span>
								</div>

								<Link
									href="/user"
									className="text-foreground flex items-center gap-3 px-4 py-3 transition-colors hover:bg-(--button)"
									onClick={() => setDropdownOpen(false)}
								>
									<Settings size={18} /> จัดการโปรไฟล์
								</Link>
								<button
									onClick={handleLogout}
									className="flex w-full items-center gap-3 px-4 py-3 text-left text-red-500 transition-colors hover:bg-red-500/10"
								>
									<LogOut size={18} /> ออกจากระบบ
								</button>
							</div>
						)}
					</div>
				:	<Link href="/login">
						<button className="flex items-center gap-1 rounded-full border border-(--orangeBorder) bg-(--orangeBG) px-3 py-2 text-sm font-medium whitespace-nowrap text-(--orangeText) shadow-sm transition-all hover:opacity-90 sm:gap-2 sm:px-5 sm:text-base">
							<LogIn size={18} className="h-4 w-4 sm:h-5 sm:w-5" /> เข้าสู่ระบบ
						</button>
					</Link>
				}
			</div>
		</div>
	);
}
