import { getImmigrantData } from "@/lib/server/immigrant";

export default async function Immigrant() {
	const data = await getImmigrantData();
	return (
		<div>
			<h1>แอบเข้า</h1>
			<pre>{JSON.stringify(data, undefined, " ")}</pre>;
		</div>
	);
}
