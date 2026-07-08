import { Pool } from "pg";

import config from "./utils/config";

const connectionString = config.DATABASE_URL;

const isLocalhost =
	!connectionString
	|| connectionString.includes("localhost")
	|| connectionString.includes("127.0.0.1");

const pool = new Pool({
	connectionString,
	ssl: isLocalhost ? false : { rejectUnauthorized: false },
	max: 25,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
	console.error("❌ PostgreSQL Connection error:", err.message);
});

export default pool;
