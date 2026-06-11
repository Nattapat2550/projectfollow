import OverrideBreadcrumb from "@/components/breadcrumb/breadcrumb-override";
import { getSingleDeportData } from "@/lib/server/deport";

export default async function SingleDeport({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const data = await getSingleDeportData(id);

	return (
		<div>
			<OverrideBreadcrumb
				overrides={{
					[id]:
						data ? [data.first_name_th, data.last_name_th].join(" ") : "ไม่พบ",
				}}
			/>
			<h1>ส่งกลับ</h1>
			<pre>{JSON.stringify(data, undefined, " ")}</pre>;
		</div>
	);
}
