"use client";

export function getClientAuthData(): {
	token: string | null;
	user: User | null;
} {
	let token = localStorage.getItem("token");

	if (!token || token === "null") {
		token =
			document.cookie
				.split("; ")
				.find((row) => row.startsWith("token="))
				?.split("=")[1] ?? null;
	}

	const user = localStorage.getItem("user");

	return {
		token: !token || token === "null" ? null : token,
		user: !user || user === "null" ? null : JSON.parse(user),
	};
}

export function setClientAuthData(token: string, user: User): void {
	document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax; ${process.env.NODE_ENV === "production" ? "Secure" : ""}`;

	localStorage.setItem("token", token);
	localStorage.setItem("user_id", user.id);
	localStorage.setItem("user", JSON.stringify(user));
}

export function clearClientAuthData(): void {
	document.cookie = `token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; ${process.env.NODE_ENV === "production" ? "Secure;" : ""}`;

	localStorage.removeItem("token");
	localStorage.removeItem("user_id");
	localStorage.removeItem("user");
}
