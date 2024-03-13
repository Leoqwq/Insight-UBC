import {InsightResult} from "./IInsightFacade";
import {CompoundOrder, Query} from "./QueryStructure";
import ValidQueryHelpers from "./ValidQueryHelpers";

export class SortHelpers {
	public applyOrder(data: InsightResult[],
		order: string | CompoundOrder, queryModel: Query, vh: ValidQueryHelpers): InsightResult[] {
		switch (order) {
			case vh.findDatasetId(queryModel) + "_" + "audit":
			case vh.findDatasetId(queryModel) + "_" + "avg":
			case vh.findDatasetId(queryModel) + "_" + "year":
			case vh.findDatasetId(queryModel) + "_" + "pass":
			case vh.findDatasetId(queryModel) + "_" + "fail":
				return this.sortNumeric(data, order);
			case vh.findDatasetId(queryModel) + "_" + "uuid":
			case vh.findDatasetId(queryModel) + "_" + "dept":
			case vh.findDatasetId(queryModel) + "_" + "id":
			case vh.findDatasetId(queryModel) + "_" + "title":
			case vh.findDatasetId(queryModel) + "_" + "instructor":
				return this.sortAlphabetic(data, order);
			default:
				return data;
		}
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
}
