import {Query, Transformation} from "./QueryStructure";

export class ValidateTransformationHelper {
	public validateTransformation(transformations: Transformation, q: Query): boolean {
		if (transformations.APPLY == null || transformations.GROUP == null || transformations.GROUP.length === 0 ||
		!Array.isArray(transformations.APPLY)) {
			return false;
		}
		const allColKeys = q.OPTIONS.COLUMNS;
		let datasetId = "_";
		for (const colKey of allColKeys) {
			if(colKey.indexOf("_") !== -1 && datasetId === "_") {
				datasetId = colKey.substring(0, colKey.indexOf("_"));
			}
		}

		let allTransKeys: string[] = [];
		for (const a of transformations.APPLY) {
			const keys = Object.keys(a);
			for (const key of keys) {
				allTransKeys.push(key);
				const innerObject = a[key];
				const validOperations = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
				if (!validOperations.includes(Object.keys(innerObject)[0]) || Object.keys(innerObject).length !== 1) {
					return false;
				}
			}
		}
		const allKeys = ["avg", "pass", "fail", "audit", "year",
			"dept", "id", "instructor", "title", "uuid"];
		let index = transformations.GROUP[0].indexOf("_");
		const id = transformations.GROUP[0].substring(0, index);
		for (const key of transformations.GROUP) {
			if (key.indexOf("_") === -1 || key.substring(0, index) !== id) {
				return false;
			}
			let i = key.indexOf("_");
			if (!allKeys.includes(key.substring(i + 1))) {
				return false;
			}
			allTransKeys.push(key);
		}
		if (id !== datasetId && datasetId !== "_") {
			return false;
		}
		for (const key of allColKeys) {
			if (!allTransKeys.includes(key)) {
				return false;
			}
		}
		return true;
	}
}
