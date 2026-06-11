import { getDeportData } from "@/lib/server/deport";

export default async function Deport() {
	const data = await getDeportData();
	return (
		<div>
			<h1>ส่งกลับ</h1>
			<pre>{JSON.stringify(data, undefined, " ")}</pre>;
		</div>
	);
}
