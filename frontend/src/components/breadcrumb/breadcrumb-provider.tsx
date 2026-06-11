"use client";

import {
	createContext,
	Dispatch,
	PropsWithChildren,
	SetStateAction,
	useState,
} from "react";

import NavigationBreadcrumb, {
	BreadcrumbOverride,
} from "./breadcrumb-navigation";

export type SetBreadcrumbOverrides = {
	setOverrides: Dispatch<SetStateAction<BreadcrumbOverride>>;
};

export const BreadcrumbContext = createContext<
	SetBreadcrumbOverrides | undefined
>(undefined);

export default function BreadcrumbWrapper({ children }: PropsWithChildren) {
	const [overrideBreadcrumb, setOverrideBreadcrumb] =
		useState<BreadcrumbOverride>({});
	return (
		<div className="container mx-auto py-10">
			<NavigationBreadcrumb override={overrideBreadcrumb} />
			<BreadcrumbContext.Provider
				value={{ setOverrides: setOverrideBreadcrumb }}
			>
				{children}
			</BreadcrumbContext.Provider>
		</div>
	);
}
