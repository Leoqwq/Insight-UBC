import {Query, Where} from "./QueryModel";
import {InsightDataset, InsightError, InsightResult, ResultTooLargeError} from "./IInsightFacade";
import {Section} from "./InsightFacade";
import e from "express";

export default class ValidQueryHelpers {

	public findDatasetId(validQuery: Query): string {
		const keyPair = validQuery.OPTIONS.COLUMNS[0];
		const underscoreIndex = keyPair.indexOf("_");
		return keyPair.substring(0,underscoreIndex);
	}

	public getAll(dataset: any, id: string) {
		const returnResult: InsightResult[] = [];
		const attributes = ["uuid", "id", "title", "instructor", "dept", "year", "avg", "pass", "fail", "audit"];
		for (const element of dataset) {
			let resultElement: InsightResult = {};
			for (const attribute of attributes) {
				resultElement[id + "_" + attribute] = element[attribute];
			}
			returnResult.push(resultElement);
		}
		return returnResult;
	}

	public filterResult(dataset: any, where: Where, id: string): InsightResult[] {
		const returnResult: InsightResult[] = [];
		if (Object.keys(where).length === 0) {
			const attributes = ["uuid", "id", "title", "instructor", "dept", "year", "avg", "pass", "fail", "audit"];
			for (const element of dataset) {
				let resultElement: InsightResult = {};
				for (const attribute of attributes) {
					resultElement[id + "_" + attribute] = element[attribute];
					returnResult.push(resultElement);
				}
			}
			return returnResult;
		}
		if (where.GT !== undefined) {
			return this.handleGT(where.GT, dataset);
		} else if (where.LT !== undefined) {
			return this.handleLT(where.LT, dataset);
		} else if (where.EQ !== undefined) {
			return this.handleEQ(where.EQ, dataset);
		} else if (where.IS !== undefined) {
			return this.handleIS(where.IS, dataset);
		} else if (where.NOT !== undefined) {
			return this.handleNOT(where.NOT, dataset, id);
		}
		return returnResult;
	}

	public filterColumns(query: Query, results: InsightResult[], key: string): InsightResult[] {
		const attributes = this.getAttributes(query.OPTIONS.COLUMNS);
		const filteredResults: InsightResult[] = [];
		for (const result of results) {
			const filteredResult: InsightResult = {}; // Create a new object for each iteration
			for (const attribute of attributes) {
				filteredResult[key + "_" + attribute] = result[key + "_" + attribute];
			}
			filteredResults.push(filteredResult);
		}
		return filteredResults;
	}

	public handleIS(is: object, dataset: any): InsightResult[] {
		const returnResult: InsightResult[] = [];
		const key = Object.keys(is)[0];
		const i = key.indexOf("_");
		const field = key.substring(i + 1, key.length);
		const array = Object.entries(is);
		const value: string = array[0][1];
		const attributes = ["uuid", "id", "title", "instructor", "dept", "year", "avg", "pass", "fail", "audit"];
		for (const element of dataset) {
			if (this.satisfy(this.findElementValue(field, element) as string, value)) {
				let resultElement: InsightResult = {};
				for (const attribute of attributes) {
					resultElement[key.substring(0, i) + "_" + attribute] = element[attribute];
				}
				returnResult.push(resultElement);
			}
		}
		return returnResult;
	}

	public satisfy(field: string, val: string): boolean {
		if (val[0] === "*" && val[val.length - 1] === "*") {
			const part = val.substring(1, val.length - 1);
			return field.includes(part);
		} else if (val[0] === "*") {
			const part = val.substring(1, val.length);
			return field.endsWith(part);
		} else if (val[val.length - 1] === "*") {
			const part = val.substring(0, val.length - 1);
			return field.startsWith(part);
		}
		return field === val;
	}

	public handleGT(gt: object, dataset: any): InsightResult[] {
		const returnResult: InsightResult[] = [];
		const key = Object.keys(gt)[0];
		const i = key.indexOf("_");
		const field = key.substring(i + 1, key.length);
		const gtArray = Object.entries(gt);
		const value: number = gtArray[0][1];
		const attributes = ["uuid", "id", "title", "instructor", "dept", "year", "avg", "pass", "fail", "audit"];
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

	public handleLT(lt: object, dataset: any): InsightResult[] {
		const returnResult: InsightResult[] = [];
		const key = Object.keys(lt)[0];
		const i = key.indexOf("_");
		const field = key.substring(i + 1, key.length);
		const ltArray = Object.entries(lt);
		const value: number = ltArray[0][1];
		const attributes = ["uuid", "id", "title", "instructor", "dept", "year", "avg", "pass", "fail", "audit"];
		for (const element of dataset) {
			if (this.findElementValue(field, element) < value) {
				let resultElement: InsightResult = {};
				for (const attribute of attributes) {
					resultElement[key.substring(0, i) + "_" + attribute] = element[attribute];
				}
				returnResult.push(resultElement);
			}
		}
		return returnResult;
	}

	public handleEQ(eq: object, dataset: any): InsightResult[] {
		const returnResult: InsightResult[] = [];
		const key = Object.keys(eq)[0];
		const i = key.indexOf("_");
		const field = key.substring(i + 1, key.length);
		const eqArray = Object.entries(eq);
		const value: number = eqArray[0][1];
		const attributes = ["uuid", "id", "title", "instructor", "dept", "year", "avg", "pass", "fail", "audit"];
		for (const element of dataset) {
			if (this.findElementValue(field, element) === value) {
				let resultElement: InsightResult = {};
				for (const attribute of attributes) {
					resultElement[key.substring(0, i) + "_" + attribute] = element[attribute];
				}
				returnResult.push(resultElement);
			}
		}
		return returnResult;
	}

	public findElementValue(field: string, element: any): number | string {
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

	public handleNOT(not: Where, dataset: any, id: string): InsightResult[] {
		const all = this.getAll(dataset, id);
		const stringAll = all.map((obj) => JSON.stringify(obj));
		const dataToExclude: InsightResult[] = this.filterResult(dataset, not, id);
		const stringDataToExclude: string[] = dataToExclude.map((obj) => JSON.stringify(obj));
		const stringResults: string[] = stringAll.filter((d) => !stringDataToExclude.includes(d));
		const results = stringResults.map((str) => JSON.parse(str));

		return results;
	}

	public arrayContainsObject(array: InsightResult[], obj: InsightResult, key: string): boolean {
		for (const element of array) {
			if (this.objectsEqual(element, obj, key)) {
				return true;
			}
		}
		return false;
	}

	public objectsEqual(obj1: InsightResult, obj2: InsightResult, key: string): boolean {
		const isEqual =
            obj2["uuid"] === obj1[key + "_uuid"] &&
            obj2["id"] === obj1[key + "_id"] &&
            obj2["title"] === obj1[key + "_title"] &&
            obj2["instructor"] === obj1[key + "_instructor"] &&
            obj2["dept"] === obj1[key + "_dept"] &&
            obj2["year"] === obj1[key + "_year"] &&
            obj2["avg"] === obj1[key + "_avg"] &&
            obj2["pass"] === obj1[key + "_pass"] &&
            obj2["fail"] === obj1[key + "_fail"] &&
            obj2["audit"] === obj1[key + "_audit"];
		return isEqual;
	}
}
