import {Query, Where} from "./QueryModel";
import {InsightDataset, InsightError, InsightResult, ResultTooLargeError} from "./IInsightFacade";

export default class ValidQueryHelpers {

	public findDatasetId(validQuery: Query): string {
		const keyPair = validQuery.OPTIONS.COLUMNS[0];
		const underscoreIndex = keyPair.indexOf("_");
		return keyPair.substring(0,underscoreIndex);
	}

	public filterResult(query: Query, dataset: any): InsightResult[] {

		const returnResult: InsightResult[] = [];
		if (Object.keys(query.WHERE).length === 0) {
			return dataset;
		}
		if (query.WHERE.GT !== undefined) {
			// const key = Object.keys(query.WHERE.GT)[0];
			// const i = key.indexOf("_");
			// const field = key.substring(i + 1, key.length);
			// const gtObject = query.WHERE.GT;
			// const gtArray = Object.entries(gtObject);
			// const value = gtArray[0][1];
			// const attributes = this.getAttributes(query.OPTIONS.COLUMNS);
			// for (const element of dataset) {
			// 	if (this.findElementValue(field, element) > value) {
			// 		let resultElement: InsightResult = {};
			// 		for (const attribute of attributes) {
			// 			resultElement[key.substring(0, i) + "_" + attribute] = element[attribute];
			// 		}
			// 		returnResult.push(resultElement);
			// 	}
			// }
			return this.handleGT(query, query.WHERE.GT, dataset);
		} else if (query.WHERE.LT !== undefined) {
			const key = Object.keys(query.WHERE.LT)[0];
			const i = key.indexOf("_");
			const field = key.substring(i + 1, key.length);
			const ltObject = query.WHERE.LT;
			const ltArray = Object.entries(ltObject);
			const value = ltArray[0][1];
			const attributes = this.getAttributes(query.OPTIONS.COLUMNS);
			for (const element of dataset) {
				if (this.findElementValue(field, element) < value) {
					let resultElement: InsightResult = {};
					for (const attribute of attributes) {
						resultElement[key.substring(0, i) + "_" + attribute] = element[attribute];
					}
					returnResult.push(resultElement);
				}
			}
		} else if (query.WHERE.EQ !== undefined) {
			const key = Object.keys(query.WHERE.EQ)[0];
			const i = key.indexOf("_");
			const field = key.substring(i + 1, key.length);
			const eqObject = query.WHERE.EQ;
			const eqArray = Object.entries(eqObject);
			const value = eqArray[0][1];
			const attributes = this.getAttributes(query.OPTIONS.COLUMNS);
			for (const element of dataset) {
				if (this.findElementValue(field, element) === value) {
					let resultElement: InsightResult = {};
					for (const attribute of attributes) {
						resultElement[key.substring(0, i) + "_" + attribute] = element[attribute];
					}
					returnResult.push(resultElement);
				}
			}
		}
		return returnResult;
	}

	public handleGT(query: Query, gt: object, dataset: any): InsightResult[] {
		const returnResult: InsightResult[] = [];
		const key = Object.keys(gt)[0];
		const i = key.indexOf("_");
		const field = key.substring(i + 1, key.length);
		const gtArray = Object.entries(gt);
		const value: number = gtArray[0][1];
		const attributes = this.getAttributes(query.OPTIONS.COLUMNS);
		for (const element of dataset) {
			if (this.findElementValue(field, element) > value) {
				let resultElement: InsightResult = {};
				for (const attribute of attributes) {
					resultElement[key.substring(0, i) + "_" + attribute] = element[attribute];
				}
				returnResult.push(resultElement);
			}
		}
		return returnResult;
	}

	public findElementValue(field: string, element: any): number {
		switch (field) {
			case "uuid":
				return element.uuid;
			case "id":
				return element.id;
			case "title":
				return element.title;
			case "instructor":
				return element.instructor;
			case "dept":
				return element.dept;
			case "year":
				return element.year;
			case "avg":
				return element.avg;
			case "pass":
				return element.pass;
			case "fail":
				return element.fail;
			case "audit":
				return element.audit;
			default:
				return -1;
		}
	}

	public getAttributes(columns: string[]): string[] {
		const i = columns[0].indexOf("_");
		const attributes: string[] = [];
		for (const column of columns) {
			attributes.push(column.substring(i + 1, column.length));
		}
		return attributes;
	}
}
