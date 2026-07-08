import { z, ZodError } from "zod";
import "dotenv/config";

const configSchema = z.object({
	NODE_ENV: z.string().default("development"),

	PORT: z.coerce.number().default(8000),
	DATABASE_URL: z
		.url()
		.refine(
			(url) => url.startsWith("postgres://") || url.startsWith("postgresql://"),
			"DB_URL must be a valid postgresql url"
		),
	FRONTEND_URL: z.url(),

	JWT_SECRET: z.string(),
	JWT_EXPIRE: z.string(),
	JWT_COOKIE_EXPIRE: z.coerce.number(),

	GOOGLE_DRIVE_FOLDER_ID: z.string(),
	GOOGLE_DRIVE_FOLDER_PASSPORT: z.string(),
	GOOGLE_CLIENT_SECRET: z.string(),
	GOOGLE_CLIENT_ID: z.string(),
	GOOGLE_REFRESH_TOKEN: z.string(),
});

function parseConfig(): z.infer<typeof configSchema> {
	try {
		return configSchema.parse(process.env);
	} catch (error) {
		if (error instanceof ZodError) {
			throw new Error(`Env Error ${z.treeifyError(error)}`, { cause: error });
		}
		throw new Error(`Env Error ${error}`, { cause: error });
	}
}

const config = parseConfig();

export default config;
