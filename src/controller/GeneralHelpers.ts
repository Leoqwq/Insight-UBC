import {CompoundOrder, Query} from "./QueryStructure";
import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";

export class GeneralHelpers {
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

	public validateOrderSimple(Order: string, COLUMNS: string[]): boolean {
		return COLUMNS.includes(Order);
	}

	public validateOrderComplex(order: CompoundOrder, COLUMNS: string[]) {
		if (!(order.dir === "UP" || order.dir === "DOWN") || order.keys == null) {
			return false;
		}
		for (let key of order.keys) {
			if (!COLUMNS.includes(key)) {
				return false;
			}
		}
		return true;
	}

	public assignMField(q: Query, datasets: InsightDataset[]): string[] {
		if (this.getType(q, datasets) === InsightDatasetKind.Sections) {
			return ["avg", "pass", "fail", "audit", "year"];
		} else if (this.getType(q, datasets) === InsightDatasetKind.Rooms) {
			return ["lat", "lon", "seats"];
		}
		return [];
	}

	public assignSField(q: Query, datasets: InsightDataset[]): string[] {
		if (this.getType(q, datasets) === InsightDatasetKind.Sections) {
			return ["dept", "id", "instructor", "title", "uuid"];
		} else if (this.getType(q, datasets) === InsightDatasetKind.Rooms) {
			return ["fullname", "shortname", "number", "name", "address", "type",
				"furniture", "href"];
		}
		return [];
	}

	public getType(q: Query, datasets: InsightDataset[]): InsightDatasetKind | undefined {
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
		for (const dataset of datasets) {
			if (dataset.id === id) {
				return dataset.kind;
			}
		}
	}

	public assignKeys(q: Query, datasets: InsightDataset[]): string[] {
		if (this.getType(q, datasets) === InsightDatasetKind.Sections) {
			return ["avg", "pass", "fail", "audit", "year",
				"dept", "id", "instructor", "title", "uuid"];
		} else {
			return ["fullname", "shortname", "number", "name",
				"address", "lat", "lon", "seats", "type", "furniture", "href"];
		}
	}
}
