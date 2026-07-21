export function getValidImageUrl(url: string) {
	if (url.startsWith("blob:")) return url;
	if (url.includes("drive.google.com/file/d/")) {
		const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
		if (match && match[1]) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
	} else if (url.includes("id=")) {
		const match = url.match(/id=([^&]+)/);
		if (match && match[1]) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
	}
	if (url.startsWith("/")) {
		const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
		return `${backendUrl}${url}`;
	}
	console.log(url);

	return url;
}
