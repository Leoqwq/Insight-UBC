import {InsightResult} from "./IInsightFacade";
import {Query} from "./QueryStructure";
import {constants} from "fs";
import {Section} from "./InsightFacade";
import {createDiffieHellmanGroup} from "crypto";
import Decimal from "decimal.js";

export class GroupBy {
	public handleGroup(results: InsightResult[], query: Query): InsightResult[] {
		if (query.TRANSFORMATIONS == null) {
			return results;
		}
		const  myMap = new Map<string, InsightResult[]>();
		for (const element of results) {
			let key = "";
			for (const groupEle of query.TRANSFORMATIONS.GROUP) {
				key = key + element[groupEle];
			}
			if (!myMap.has(key)) {
				myMap.set(key, [element]);
			} else if (myMap.has(key) && myMap.get(key) !== undefined) {
				const list = myMap.get(key) as InsightResult[];
				list.push(element);
				myMap.set(key, list);
			}
		}
		const data = this.handleApply(myMap, query, query.TRANSFORMATIONS.APPLY);
		return data;
	}

	public handleApply(map: Map<string, InsightResult[]>, query: Query,
		apply: Array<{[key: string]: {[key: string]: string}}>): InsightResult[] {
		let r: InsightResult[] = [];
		map.forEach((value, key) => {
			let result = value[0];
			for (const a of apply) {
				result = this.handleOperation(a, value, result);
			}
			r.push(result);
		});
		return r;
	}

	public handleOperation(apply: {[key: string]: {[key: string]: string}},
		listOfResult: InsightResult[], result: InsightResult): InsightResult {
		let key = Object.keys(apply)[0];
		let innerObject = apply[key];
		let operation = Object.keys(innerObject)[0];
		let numberList: number[] = [];
		let numberAttribute: number;
		let uniqueValues = new Set();
		let decimal = new Decimal(0);
		switch (operation) {
			case "MAX":
				for (const r of listOfResult) {
					numberList.push(r[innerObject[operation]] as number);
				}
				numberAttribute = Math.max(...numberList);
				result[key] = numberAttribute;
				return result;
			case "MIN":
				for (const r of listOfResult) {
					numberList.push(r[innerObject[operation]] as number);
				}
				numberAttribute = Math.min(...numberList);
				result[key] = numberAttribute;
				return result;
			case "COUNT":
				for (const r of listOfResult) {
					if (r[innerObject[operation]] !== undefined) {
						uniqueValues.add(r[innerObject[operation]]);
					}
				}
				result[key] = uniqueValues.size;
				return result;
			case "AVG":
				for (const r of listOfResult) {
					decimal = decimal.add(new Decimal(r[innerObject[operation]]));
				}
				numberAttribute = decimal.toNumber() / listOfResult.length;
				result[key] = Number(numberAttribute.toFixed(2));
				return result;
			case "SUM":
				for (const r of listOfResult) {
					decimal = decimal.add(new Decimal(r[innerObject[operation]]));
				}
				numberAttribute = Number(decimal.toFixed(2));
				result[key] = numberAttribute;
				return result;

		}
		return result;
	}
}
