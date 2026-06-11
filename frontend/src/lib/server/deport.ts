import { faker } from "@faker-js/faker";

faker.seed(321);

const mockData: DeportData[] = [...Array(100)].map(() => ({
	id: faker.string.uuid(),

	first_name_th: faker.person.firstName(),
	middle_name_th:
		faker.datatype.boolean({ probability: 0.2 }) ?
			faker.person.middleName()
		:	null,
	last_name_th: faker.person.lastName(),

	first_name_en: faker.person.firstName(),
	middle_name_en:
		faker.datatype.boolean({ probability: 0.2 }) ?
			faker.person.middleName()
		:	null,
	last_name_en: faker.person.lastName(),

	gender: faker.person.sexType({ includeGeneric: false }) as "male" | "female",
	national_id: faker.helpers.fromRegExp("[0-9]{13}"),
	passport_id:
		faker.datatype.boolean({ probability: 0.5 }) ?
			faker.helpers.fromRegExp("[A-Z]{1,3}[0-9]{6,8}")
		:	null,

	birth_day: faker.date.birthdate().getDate(),
	birth_month: faker.date.birthdate().getMonth(),
	birth_year: faker.date.birthdate().getFullYear(),

	address: faker.location.streetAddress({ useFullAddress: true }),
	image_url:
		faker.datatype.boolean({ probability: 0.8 }) ? faker.internet.url() : null,

	number_of_case: faker.number.int({ min: 0, max: 20 }),
	number_of_warrant: faker.number.int({ min: 0, max: 20 }),

	is_victim:
		faker.datatype.boolean({ probability: 0.7 }) ?
			faker.datatype.boolean({ probability: 0.3 })
		:	null,
}));

export async function getDeportData(
	page: number = 0,
	limit: number = 25
): Promise<{
	data: DeportData[];
	total: number;
}> {
	const offset = page * limit;
	return {
		data: mockData.slice(offset, offset + limit),
		total: mockData.length,
	};
}
