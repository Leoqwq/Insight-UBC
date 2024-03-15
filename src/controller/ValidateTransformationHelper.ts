import {Query, Transformation} from "./QueryStructure";
import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";

export class ValidateTransformationHelper {
	private datasets: InsightDataset[];
	constructor(datasets: InsightDataset[]) {
		this.datasets = datasets;
	}

	public meetBasicReq(transformations: Transformation) {
		// console.log(Object.keys(transformations.APPLY));
		if (!(transformations.APPLY == null || transformations.GROUP == null || transformations.GROUP.length === 0 ||
		!Array.isArray(transformations.APPLY))) {
			const listOfKeys: string[] = [];
			for (const a of transformations.APPLY) {
				if (!listOfKeys.includes(Object.keys(a)[0])) {
					listOfKeys.push(Object.keys(a)[0]);
				} else {
					return false;
				}
			}
			return true;
		}
		return false;
		// return !(transformations.APPLY == null || transformations.GROUP == null || transformations.GROUP.length === 0 ||
		// 	!Array.isArray(transformations.APPLY));
	}

	public getType(q: Query): InsightDatasetKind | undefined {
		console.log("get type");
		let i: number;
		let id: string;
		if (q.TRANSFORMATIONS == null) {
			i = q.OPTIONS.COLUMNS[0].indexOf("_");
			id = q.OPTIONS.COLUMNS[0].substring(0, i);
		} else if (q.TRANSFORMATIONS.GROUP !== undefined && q.TRANSFORMATIONS.GROUP.length !== 0) {
			i = q.TRANSFORMATIONS.GROUP[0].indexOf("_");
			id = q.TRANSFORMATIONS.GROUP[0].substring(0, i);
		} else {
			id = "_";
		}
		for (const dataset of this.datasets) {
			if (dataset.id === id) {
				console.log(dataset.kind);
				return dataset.kind;
			}
		}
	}

	public validateTransformation(transformations: Transformation, q: Query): boolean {
		if (!this.meetBasicReq(transformations)) {
			return false;
		}
		const allColKeys = q.OPTIONS.COLUMNS;
		let datasetId = "_";
		datasetId = this.getID(q.OPTIONS.COLUMNS, datasetId);
		let allTransKeys: string[] = [];
		for (const a of transformations.APPLY) {
			const keys = Object.keys(a);
			for (const key of keys) {
				allTransKeys.push(key);
				const innerObject = a[key];
				const validOperations = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
				if (!validOperations.includes(Object.keys(innerObject)[0]) || Object.keys(innerObject).length !== 1 ||
				!this.isValidKey(innerObject, q)) {
					return false;
				}
			}
		}
		let allKeys: string[];
		if (this.getType(q) === InsightDatasetKind.Sections) {
			allKeys = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"];
		} else if (this.getType(q) === InsightDatasetKind.Rooms) {
			allKeys = ["fullname", "shortname", "number", "name",
				"address", "lat", "lon", "seats", "type", "furniture", "href"];
		} else {
			allKeys = [];
		}
		const id = transformations.GROUP[0].substring(0, transformations.GROUP[0].indexOf("_"));
		for (const key of transformations.GROUP) {
			if (key.indexOf("_") === -1 || key.substring(0, transformations.GROUP[0].indexOf("_")) !== id) {
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

	private isValidKey(innerObject: {[p: string]: string}, q: Query) {
		console.log(innerObject);
		let operation = Object.keys(innerObject)[0];
		let type: InsightDatasetKind | undefined;
		let possibleKeys: string[] = [];
		console.log(operation);
		switch (operation) {
			case "MAX":
			case "MIN":
			case "SUM":
			case "AVG":
				if (this.getType(q) === InsightDatasetKind.Rooms) {
					possibleKeys = ["lat", "lon", "seats"];
				} else if (this.getType(q) === InsightDatasetKind.Sections) {
					possibleKeys = ["avg", "pass", "fail", "audit", "year"];
				}
				break;
			case "COUNT":
				if (this.getType(q) === InsightDatasetKind.Rooms) {
					possibleKeys = ["fullname", "shortname", "number", "name",
						"address", "lat", "lon", "seats", "type", "furniture", "href"];
				} else if (this.getType(q) === InsightDatasetKind.Sections) {
					possibleKeys = ["avg", "pass", "fail", "audit", "year",
						"dept", "id", "instructor", "title", "uuid"];
				}
				break;
		}
		if (q.TRANSFORMATIONS !== undefined) {
			let i = q.TRANSFORMATIONS.GROUP[0].indexOf("_");
			let key = innerObject[operation].substring(i + 1);
			console.log("key is " + key);
			console.log(possibleKeys.includes(key));
			return possibleKeys.includes(key);
		}
		return false;
	}

	private getID(allColKeys: string[], datasetId: string) {
		for (const colKey of allColKeys) {
			if(colKey.indexOf("_") !== -1 && datasetId === "_") {
				return colKey.substring(0, colKey.indexOf("_"));
			}
		}
		return "_";
	}
}
