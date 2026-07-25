interface User {
	id: string;
	name: string;
	role: string;
	color: string;
}

namespace Express {
	interface Request {
		user?: User;
	}
}

