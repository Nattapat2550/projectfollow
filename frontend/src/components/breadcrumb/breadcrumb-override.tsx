"use client";

import { PropsWithChildren, useContext, useEffect } from "react";

import { BreadcrumbOverride } from "./breadcrumb-navigation";
import { BreadcrumbContext } from "./breadcrumb-provider";

export default function OverrideBreadcrumb({
	overrides,
}: PropsWithChildren & {
	overrides: BreadcrumbOverride;
}) {
	const breadcrumbContext = useContext(BreadcrumbContext);

	useEffect(() => {
		breadcrumbContext?.setOverrides(overrides);

		// To make sure the override disappears when a user navigates to another page.
		return () => {
			breadcrumbContext?.setOverrides({});
		};
	}, [overrides, breadcrumbContext]);

	return <></>;
}
