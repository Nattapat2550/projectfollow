import DataTable from "@/components/data-table/table";
import { getDeportData } from "@/lib/server/deport";

import { deportColumns } from "./columns";

export default async function Deport() {
	const { data } = await getDeportData(0, 100);
	return (
		<div>
			<DataTable
				columns={deportColumns}
				data={data}
				createUrl="/deport/create"
				singlePage={{ key: "id", url: "/deport" }}
			/>
		</div>
	);
}
