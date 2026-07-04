const cache = new Map();

export function get(key: string) {
	return cache.get(key);
}

export function set(key: string, value: unknown) {
	cache.set(key, value);
}

export function clear() {
	cache.clear();
	console.log(
		"⚡ [Cache Manager] Cache cleared due to write/upload operation."
	);
}
