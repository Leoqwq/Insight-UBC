import {InsightResult} from "./IInsightFacade";
import {CompoundOrder, Query} from "./QueryStructure";
import ValidQueryHelpers from "./ValidQueryHelpers";

export class SortHelpers {
	public applyOrder(data: InsightResult[],
		order: string | CompoundOrder, queryModel: Query, vh: ValidQueryHelpers): InsightResult[] {
		if (typeof order === "string") {
			return this.sortSimpleOrder(order, vh, queryModel, data);
		} else {
			return this.sortComplex(data, order.keys, order.dir);
		}
	}

	private sortSimpleOrder(order: string, vh: ValidQueryHelpers, queryModel: Query,
		data: InsightResult[]): InsightResult[] {
		if (typeof (data[0][order]) === "string") {
			return this.sortAlphabetic(data, order);
		} else {
			return this.sortNumeric(data, order);
		}
		// switch (order) {
		// 	case vh.findDatasetId(queryModel) + "_" + "audit":
		// 	case vh.findDatasetId(queryModel) + "_" + "avg":
		// 	case vh.findDatasetId(queryModel) + "_" + "year":
		// 	case vh.findDatasetId(queryModel) + "_" + "pass":
		// 	case vh.findDatasetId(queryModel) + "_" + "fail":
		// 		return this.sortNumeric(data, order);
		// 	case vh.findDatasetId(queryModel) + "_" + "uuid":
		// 	case vh.findDatasetId(queryModel) + "_" + "dept":
		// 	case vh.findDatasetId(queryModel) + "_" + "id":
		// 	case vh.findDatasetId(queryModel) + "_" + "title":
		// 	case vh.findDatasetId(queryModel) + "_" + "instructor":
		// 		return this.sortAlphabetic(data, order);
		// 	default:
		// 		return data;
		// }
	}

	private sortNumeric(data: InsightResult[], order: string): InsightResult[] {
		return data.sort((a, b) => {
			return (a[order] as any) - (b[order] as any);
		});
	}

	private sortAlphabetic(data: InsightResult[], order: string): InsightResult[] {
		return data.sort((a, b) => {
			if (a[order] < b[order]) {
				return -1;
			} else if (a[order] > b[order]) {
				return 1;
			} else {
				return 0;
			}
		});
	}

// 	private sortComplexOrder(order: CompoundOrder,
// 		vh: ValidQueryHelpers, queryModel: Query, data: InsightResult[], i: number) {
// 		let o = order.keys[i];
// 		switch (o) {
// 			case vh.findDatasetId(queryModel) + "_" + "audit":
// 			case vh.findDatasetId(queryModel) + "_" + "avg":
// 			case vh.findDatasetId(queryModel) + "_" + "year":
// 			case vh.findDatasetId(queryModel) + "_" + "pass":
// 			case vh.findDatasetId(queryModel) + "_" + "fail":
// 				return this.sortNumericComplex(data, order, i);
// 			case vh.findDatasetId(queryModel) + "_" + "uuid":
// 			case vh.findDatasetId(queryModel) + "_" + "dept":
// 			case vh.findDatasetId(queryModel) + "_" + "id":
// 			case vh.findDatasetId(queryModel) + "_" + "title":
// 			case vh.findDatasetId(queryModel) + "_" + "instructor":
// 				return this.sortAlphabeticComplex(data, order, i);
// 			default:
// 				return data;
// 		}
// 	}
//

	private sortComplex(data: InsightResult[], orders: string[], dir: string): InsightResult[] {
		return data.sort((a, b) => {
			for (const order of orders) {
				const aValue = a[order];
				const bValue = b[order];
				if (aValue !== bValue) {
					if (typeof (aValue) === "string" && typeof (bValue) === "string") {
						return aValue.localeCompare(bValue);
					} else if (typeof (aValue) === "number" && typeof (bValue) === "number"){
						return aValue - bValue;
					}
				}
			}
			return 0;
		});
	}
}
