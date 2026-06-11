import { faker } from "@faker-js/faker";

faker.seed(123);

const mockData: ImmigrantData[] = [...Array(100)].map(() => ({
	id: faker.string.uuid(),
	first_name: faker.person.firstName(),
	middle_name:
		faker.datatype.boolean({ probability: 0.2 }) ?
			faker.person.middleName()
		:	null,
	last_name: faker.person.lastName(),

	gender: faker.person.sexType({ includeGeneric: false }) as "male" | "female",
	nationality: faker.location.country(),
	passport_id:
		faker.datatype.boolean({ probability: 0.5 }) ?
			faker.helpers.fromRegExp("[A-Z]{1,3}[0-9]{6,8}")
		:	null,

	detected_location: faker.location.streetAddress({ useFullAddress: true }),
	detected_date:
		faker.datatype.boolean({ probability: 0.5 }) ?
			faker.date.anytime().toISOString()
		:	null,

	is_victim:
		faker.datatype.boolean({ probability: 0.7 }) ?
			faker.datatype.boolean({ probability: 0.3 })
		:	null,
}));

export async function getImmigrantData(
	page: number = 0,
	limit: number = 25
): Promise<{
	data: ImmigrantData[];
	total: number;
}> {
	const offset = page * limit;
	return {
		data: mockData.slice(offset, offset + limit),
		total: mockData.length,
	};
}

export async function getSingleImmigrantData(
	id: string
): Promise<ImmigrantData | null> {
	return mockData.find((immigrant) => immigrant.id === id) ?? null;
}
