"use client";

import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react/jsx-runtime";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavigationBreadcrumbProps {
	items?: BreadcrumbMenuItem[];
	override?: BreadcrumbOverride;
}

export type BreadcrumbOverride = { [key: string]: string };

type BreadcrumbMenuItem = BreadcrumbDropdownItem | BreadcrumbLinkItem;
type BreadcrumbDropdownItem = {
	title: string;
	url?: undefined | null;
	is_current?: boolean;
	items: BreadcrumbLinkItem[];
};
type BreadcrumbLinkItem = {
	title: string;
	url: string;
	is_current?: boolean;
	items?: undefined | null;
};

function inferBreadcrumb(
	pathname: string,
	override: BreadcrumbOverride = {}
): BreadcrumbMenuItem[] {
	const titleMap = {
		home: "หน้าหลัก",
		deport: "ส่งกลับ",
		immigrant: "แอบเข้า",
		create: "เพิ่มข้อมูล",
	};
	const pathSegments = [
		"home",
		...pathname.split("/").filter((segment) => segment !== ""),
	];
	return pathSegments.map((segment, index) => ({
		title:
			Object.hasOwn(override, segment) ?
				override[segment as keyof typeof override]
			: Object.hasOwn(titleMap, segment) ?
				titleMap[segment as keyof typeof titleMap]
			:	segment,
		url: `/${pathSegments.slice(1, index + 1).join("/")}`,
		is_current: index == pathSegments.length - 1,
	}));
}

export default function NavigationBreadcrumb({
	items,
	override,
}: NavigationBreadcrumbProps) {
	const pathname = usePathname();

	let itemList: BreadcrumbMenuItem[];
	if (items) {
		itemList = items;
	} else {
		itemList = inferBreadcrumb(pathname, override);
	}

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{itemList.map((item, index) => (
					<Fragment key={item.title}>
						<BreadcrumbItem>
							{item.is_current ?
								<BreadcrumbPage>{renderMenu(item)}</BreadcrumbPage>
							:	renderMenu(item)}
						</BreadcrumbItem>
						{index != itemList.length - 1 && <BreadcrumbSeparator />}
					</Fragment>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}

function renderMenu(item: BreadcrumbMenuItem) {
	return item.items ?
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button className="flex items-center gap-1">
						{item.title}
						<ChevronDownIcon className="size-3.5" />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					<DropdownMenuGroup>
						{item.items.map((subItem) => (
							<Link href={subItem.url} key={subItem.title}>
								<DropdownMenuItem>{subItem.title}</DropdownMenuItem>
							</Link>
						))}
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		:	<BreadcrumbLink href={item.url}>{item.title}</BreadcrumbLink>;
}
