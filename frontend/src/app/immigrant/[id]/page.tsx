import OverrideBreadcrumb from "@/components/breadcrumb/breadcrumb-override";
import { getSingleImmigrantData } from "@/lib/server/immigrant";

export default async function SingleImmigrant({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const data = await getSingleImmigrantData(id);

	return (
		<div>
			<OverrideBreadcrumb
				overrides={{
					[id]: data ? [data.first_name, data.last_name].join(" ") : "ไม่พบ",
				}}
			/>
			<pre>{JSON.stringify(data, undefined, " ")}</pre>;
		</div>
	);
}
