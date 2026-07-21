export default function TablePagination({
	currentPage,
	totalPages,
	handlePageChange,
}: {
	currentPage: number;
	totalPages: number;
	handlePageChange: (_newPage: number) => void;
}) {
	let startPage = Math.max(1, currentPage - 5);
	let endPage = Math.min(totalPages, currentPage + 5);

	if (endPage - startPage < 10) {
		if (startPage === 1) {
			endPage = Math.min(totalPages, startPage + 10);
		} else if (endPage === totalPages) {
			startPage = Math.max(1, endPage - 10);
		}
	}

	const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

	return (
		<div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-sm border border-(--wrapper) bg-(--container) p-4 shadow-[0_1px_2px_var(--shadow)] md:flex-row">
			<span className="text-sm font-medium opacity-70">
				หน้า {currentPage} จาก {totalPages}
			</span>

			<div className="flex items-center gap-1 sm:gap-2">
				<button
					disabled={currentPage === 1}
					onClick={() => handlePageChange(1)}
					className="text-foreground cursor-pointer rounded-sm border border-(--wrapper) bg-(--button) px-3 py-2 text-sm font-medium transition hover:bg-(--row-hover) disabled:opacity-30"
					title="หน้าแรกสุด"
				>
					&laquo;
				</button>
				<button
					disabled={currentPage === 1}
					onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
					className="text-foreground cursor-pointer rounded-sm border border-(--wrapper) bg-(--button) px-3 py-2 text-sm font-medium transition hover:bg-(--row-hover) disabled:opacity-30"
					title="ก่อนหน้า"
				>
					&lsaquo;
				</button>

				<div className="hidden items-center gap-1 overflow-x-auto sm:flex">
					{pageNumbers.map((page) => (
						<button
							key={page}
							onClick={() => handlePageChange(page)}
							className={`cursor-pointer rounded-sm border px-3 py-2 text-sm font-medium transition ${
								page === currentPage ?
									"text-background pointer-events-none border-transparent bg-(--header) font-bold"
								:	"text-foreground border-(--wrapper) bg-(--button) hover:bg-(--row-hover)"
							}`}
						>
							{page}
						</button>
					))}
				</div>

				<button
					disabled={currentPage === totalPages}
					onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
					className="text-foreground cursor-pointer rounded-sm border border-(--wrapper) bg-(--button) px-3 py-2 text-sm font-medium transition hover:bg-(--row-hover) disabled:opacity-30"
					title="ถัดไป"
				>
					&rsaquo;
				</button>
				<button
					disabled={currentPage === totalPages}
					onClick={() => handlePageChange(totalPages)}
					className="text-foreground cursor-pointer rounded-sm border border-(--wrapper) bg-(--button) px-3 py-2 text-sm font-medium transition hover:bg-(--row-hover) disabled:opacity-30"
					title="หน้าท้ายสุด"
				>
					&raquo;
				</button>
			</div>
		</div>
	);
}
