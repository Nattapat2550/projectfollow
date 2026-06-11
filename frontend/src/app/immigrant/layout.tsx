import BreadcrumbWrapper from "@/components/breadcrumb/breadcrumb-provider";

export default function BreadcrumbLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <BreadcrumbWrapper>{children}</BreadcrumbWrapper>;
}
