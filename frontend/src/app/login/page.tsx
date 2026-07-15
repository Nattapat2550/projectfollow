import LoginForm from "@/components/login/LoginForm";

export default function LoginPage() {
	return (
		<div
			className="flex min-h-screen items-center justify-center p-4"
			style={{ backgroundColor: "var(--background)" }}
		>
			<LoginForm />
		</div>
	);
}
