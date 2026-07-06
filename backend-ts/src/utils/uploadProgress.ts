type UploadProgressValue = {
	current?: number;
	total?: number;
	successCount?: number;
	failedCount?: number;
	status?: string;
};

class UploadProgress {
	private uploadProgress: Map<
		string,
		{ value: UploadProgressValue; expiresAt: Date }
	>;
	constructor() {
		this.uploadProgress = new Map();
	}

	public get(key: string): UploadProgressValue | undefined {
		this.clearExpired();
		return this.uploadProgress.get(key)?.value;
	}

	public set(key: string, value: UploadProgressValue) {
		this.clearExpired();
		this.uploadProgress.set(key, {
			value,
			expiresAt: new Date(Date.now() + 1000 * 60 * 5),
		});
	}

	public clearExpired(): void {
		for (const key of this.uploadProgress.keys()) {
			const p = this.uploadProgress.get(key);
			if (p && new Date() > p.expiresAt) {
				this.uploadProgress.delete(key);
			}
		}
	}
}

const uploadProgress = new UploadProgress();
export default uploadProgress;
