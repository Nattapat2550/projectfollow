import app from "./app";
import pool from "./db";
import config from "./utils/config";

try {
	await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_repatriated_persons_return_date ON repatriated_persons(return_date DESC NULLS LAST);
    CREATE INDEX IF NOT EXISTS idx_repatriated_persons_created_by ON repatriated_persons(created_by);
    CREATE INDEX IF NOT EXISTS idx_repatriated_persons_national_id ON repatriated_persons(national_id);
    CREATE INDEX IF NOT EXISTS idx_repatriated_persons_passport_id ON repatriated_persons(passport_id);
  `);
	console.log("⚡ PostgreSQL Database indexes verified/created");
} catch (error) {
	console.error(
		"⚠️ Failed to verify/create PostgreSQL database indexes:",
		error
	);
} finally {
	const PORT = config.PORT || 8000;

	const server = app.listen(PORT, "0.0.0.0", () => {
		console.log(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
	});

	process.on("unhandledRejection", (err) => {
		console.log(`Unhandled Rejection Error: ${err}`);
		server.close(() => process.exit(1));
	});
}
