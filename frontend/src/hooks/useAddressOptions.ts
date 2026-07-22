import React, { useMemo, useState } from "react";

import addresses from "../../public/thai_addresses.json";

export interface AutocompleteOption {
	label: string;
	value: string;
	extra?: { province: string; district: string; subDistrict?: string };
}

export function useAddressOptions<T extends Record<string, string>>(
	formData: T,
	setFormData: React.Dispatch<React.SetStateAction<T>>,
	provinceKey: keyof T,
	districtKey: keyof T,
	subDistrictKey: keyof T
) {
	const province = formData[provinceKey] || null;
	const district = formData[districtKey] || null;
	const subDistrict = formData[subDistrictKey] || null;

	const initDistrict = addresses.find((e) => e.province == province && e.amphoe == district);

	const initSubDistrict = addresses.find(
		(e) => e.province == province && e.amphoe == district && e.district == subDistrict
	);

	const [provinceValue, setProvinceValue] = useState<string | null>(province);
	const [districtOption, setDistrictOption] = useState<AutocompleteOption | null>(
		initDistrict ?
			{
				label: `${initDistrict.amphoe} » ${initDistrict.province}`,
				value: initDistrict.amphoe,
				extra: { district: initDistrict.amphoe, province: initDistrict.province },
			}
		:	null
	);
	const [subDistrictOption, setSubDistrictOption] = useState<AutocompleteOption | null>(
		initSubDistrict ?
			{
				label: `${initSubDistrict.district} » ${initSubDistrict.amphoe} » ${initSubDistrict.province}`,
				value: initSubDistrict.district,
				extra: {
					subDistrict: initSubDistrict.district,
					district: initSubDistrict.amphoe,
					province: initSubDistrict.province,
				},
			}
		:	null
	);

	const provinces = useMemo(() => {
		const set = new Set<string>();
		addresses.forEach((a) => {
			if (a.province) set.add(a.province);
		});
		return Array.from(set).sort();
	}, []);

	const districts = useMemo(() => {
		const filtered = province ? addresses.filter((a) => a.province === province) : addresses;

		const seen = new Set<string>();
		const opts: AutocompleteOption[] = [];

		filtered.forEach((a) => {
			if (a.amphoe && a.province) {
				const key = `${a.amphoe} > ${a.province}`;
				if (!seen.has(key)) {
					seen.add(key);
					opts.push({
						label: `${a.amphoe} » ${a.province}`,
						value: a.amphoe,
						extra: { district: a.amphoe, province: a.province },
					});
				}
			}
		});

		return opts.sort((a, b) => a.label.localeCompare(b.label, "th"));
	}, [province]);

	const subDistricts = useMemo(() => {
		let filtered = addresses;
		if (province && district) {
			filtered = addresses.filter((a) => a.province === province && a.amphoe === district);
		} else if (province) {
			filtered = addresses.filter((a) => a.province === province);
		} else if (district) {
			filtered = addresses.filter((a) => a.amphoe === district);
		}

		const seen = new Set<string>();
		const opts: AutocompleteOption[] = [];

		filtered.forEach((a) => {
			if (a.district && a.amphoe && a.province) {
				const key = `${a.district} > ${a.amphoe} > ${a.province}`;
				if (!seen.has(key)) {
					seen.add(key);
					opts.push({
						label: `${a.district} » ${a.amphoe} » ${a.province}`,
						value: a.district,
						extra: {
							subDistrict: a.district,
							district: a.amphoe,
							province: a.province,
						},
					});
				}
			}
		});

		return opts.sort((a, b) => a.label.localeCompare(b.label, "th"));
	}, [province, district]);

	const handleProvinceChange = (value: string | null) => {
		setProvinceValue(value);
		setDistrictOption(null);
		setSubDistrictOption(null);
		setFormData((prev) => {
			return {
				...prev,
				[provinceKey]: value ?? "",
				[districtKey]: "",
				[subDistrictKey]: "",
			};
		});
	};

	const handleDistrictChange = (option: AutocompleteOption | null) => {
		if (option) {
			setProvinceValue((prev) => option?.extra?.province ?? prev);
		}

		setDistrictOption(option);
		setSubDistrictOption(null);
		setFormData((prev) => {
			return {
				...prev,
				[provinceKey]: option?.extra?.province ?? prev[provinceKey],
				[districtKey]: option?.value ?? "",
			};
		});
	};

	const handleSubDistrictChange = (option: AutocompleteOption | null) => {
		if (option) {
			const districtOption = districts.find(
				(e) =>
					e.extra?.district == option?.extra?.district
					&& e.extra?.province == option?.extra?.province
			);

			setProvinceValue((prev) => option?.extra?.province ?? prev);
			setDistrictOption((prev) => districtOption ?? prev);
		}

		setSubDistrictOption(option);
		setFormData((prev) => {
			return {
				...prev,
				[provinceKey]: option?.extra?.province ?? prev[provinceKey],
				[districtKey]: option?.extra?.district ?? prev[districtKey],
				[subDistrictKey]: option?.value ?? "",
			};
		});
	};

	return {
		actions: { handleProvinceChange, handleDistrictChange, handleSubDistrictChange },
		states: { provinceOption: provinceValue, districtOption, subDistrictOption },
		options: { provinces, districts, subDistricts },
	};
}
