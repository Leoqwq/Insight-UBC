import {InsightDataset} from "./IInsightFacade";
import exp from "constants";
import {CompoundOrder, Option, Query, Transformation, Where} from "./QueryStructure";
import {query} from "express";
import ValidQueryHelpers from "./ValidQueryHelpers";
import {ValidateTransformationHelper} from "./ValidateTransformationHelper";

export default class ValidationHelpers {

	private datasets: InsightDataset[];
	public initialMorSKey: string = "_";
	constructor(datasets: InsightDataset[]) {
		this.datasets = datasets;
	}

	public validateAnd(AND: Where[]) {
		if (AND.length === 0) {
			return false;
		} else {
			for (const item of AND) {
				if (!this.validateQueryWhere(item)) {
					return false;
				}
			}
		}
		return true;
	}

	public validateOr(OR: Where[]): boolean {
		if (OR.length === 0) {
			return false;
		} else {
			for (const item of OR) {
				if (!this.validateQueryWhere(item)) {
					return false;
				}
			}
		}
		return true;
	}

	public validateNot(NOT: Where): boolean {
		if (Object.keys(NOT).length !== 1) {
			return false;
		}
		return this.validateQueryWhere(NOT);
	}

	public validateGT(GT: object) {
		if (Object.keys(GT).length !== 1) {
			return false;
		}
		const mKey: string = Object.keys(GT)[0];
		const underscoreIndex = mKey.indexOf("_");
		if (underscoreIndex === -1) {
			return false;
		}
		const idString = mKey.substring(0, underscoreIndex);
		const mField = mKey.substring(underscoreIndex + 1);
		const ids: string[] = [];
		for (let dataset of this.datasets) {
			ids.push(dataset.id);
		}
		if (this.initialMorSKey === "_") {
			this.initialMorSKey = idString;
		} else {
			if (this.initialMorSKey !== idString) {
				return false;
			}
		}
		if (!ids.includes(idString)) {
			return false;
		}
		const possibleMField: string[] = ["avg", "pass", "fail", "audit", "year"];
		if (!possibleMField.includes(mField)) {
			return false;
		}
		if (typeof (GT as any)[mKey] !== "number") {
			return false;
		}
		return true;
	}

	public validateLT(LT: object) {
		if (Object.keys(LT).length !== 1) {
			return false;
		}
		const mKey: string = Object.keys(LT)[0];
		const underscoreIndex = mKey.indexOf("_");
		if (underscoreIndex === -1) {
			return false;
		}
		const idString = mKey.substring(0, underscoreIndex);
		const mField = mKey.substring(underscoreIndex + 1);
		const ids: string[] = [];
		for (let dataset of this.datasets) {
			ids.push(dataset.id);
		}
		if (this.initialMorSKey === "_") {
			this.initialMorSKey = idString;
		} else {
			if (this.initialMorSKey !== idString) {
				return false;
			}
		}
		if (!ids.includes(idString)) {
			return false;
		}
		const possibleMField: string[] = ["avg", "pass", "fail", "audit", "year"];
		if(!possibleMField.includes(mField)) {
			return false;
		}
		if (typeof (LT as any)[mKey] !== "number") {
			return false;
		}
		return true;
	}

	public validateEQ(EQ: object) {
		if (Object.keys(EQ).length !== 1) {
			return false;
		}
		const mKey: string = Object.keys(EQ)[0];
		const underscoreIndex = mKey.indexOf("_");
		if (underscoreIndex === -1) {
			return false;
		}
		const idString = mKey.substring(0, underscoreIndex);
		const mField = mKey.substring(underscoreIndex + 1);
		const ids: string[] = [];
		for (let dataset of this.datasets) {
			ids.push(dataset.id);
		}
		if (this.initialMorSKey === "_") {
			this.initialMorSKey = idString;
		} else {
			if (this.initialMorSKey !== idString) {
				return false;
			}
		}
		if (!ids.includes(idString)) {
			return false;
		}
		const possibleMField: string[] = ["avg", "pass", "fail", "audit", "year"];
		if(!possibleMField.includes(mField)) {
			return false;
		}
		if (typeof (EQ as any)[mKey] !== "number") {
			return false;
		}
		return true;
	}

	public validateIS(IS: object) {
		{
			if (Object.keys(IS).length !== 1) {
				return false;
			}
			const sKey: string = Object.keys(IS)[0];
			const underscoreIndex = sKey.indexOf("_");
			if (underscoreIndex === -1) {
				return false;
			}
			const idString = sKey.substring(0, underscoreIndex);
			const sField = sKey.substring(underscoreIndex + 1);
			const ids: string[] = [];
			for (let dataset of this.datasets) {
				ids.push(dataset.id);
			}
			if (this.initialMorSKey === "_") {
				this.initialMorSKey = idString;
			} else {
				if (this.initialMorSKey !== idString) {
					return false;
				}
			}
			if (!ids.includes(idString)) {
				return false;
			}
			const possibleSField: string[] = ["dept", "id", "instructor", "title", "uuid"];
			if(!possibleSField.includes(sField)) {
				return false;
			}
			if (typeof (IS as any)[sKey] !== "string") {
				return false;
			}
			const sValue: string = (IS as any)[sKey].substring(1, (IS as any)[sKey].length - 1);
			if (sValue.indexOf("*") !== -1) {
				return false;
			}
			return true;
		}
	}

	public validateQueryWhere(whereBlock: Where): boolean {
		if (whereBlock.AND !== undefined) {
			return this.validateAnd(whereBlock.AND);
		} else if (whereBlock.OR !== undefined) {
			return this.validateOr(whereBlock.OR);
		} else if (whereBlock.NOT !== undefined) {
			return this.validateNot(whereBlock.NOT);
		} else if (whereBlock.GT !== undefined) {
			return this.validateGT(whereBlock.GT);
		} else if (whereBlock.LT !== undefined) {
			return this.validateLT(whereBlock.LT);
		} else if (whereBlock.EQ !== undefined) {
			return this.validateEQ(whereBlock.EQ);
		} else if (whereBlock.IS !== undefined) {
			return this.validateIS(whereBlock.IS);
		} else if (Object.keys(whereBlock).length === 0) {
			return true;
		}
		return false;
	}

	public validateQueryOption(optionBlock: Option, q: Query): boolean {
		if (optionBlock.COLUMNS === undefined) {
			return false;
		} else {
			if (optionBlock.ORDER !== undefined && typeof (optionBlock.ORDER) === "string") {
				return this.validateColumns(optionBlock.COLUMNS, q) &&
					this.validateOrderSimple(optionBlock.ORDER, optionBlock.COLUMNS);
			} else if (optionBlock.ORDER !== undefined && typeof (optionBlock.ORDER) === "object") {
				return this.validateOrderComplex(optionBlock.ORDER, optionBlock.COLUMNS) &&
					this.validateColumns(optionBlock.COLUMNS, q);
			}
			return this.validateColumns(optionBlock.COLUMNS, q);
		}
	}

	public validateColumns(COLUMNS: string[], q: Query): boolean {
		if (COLUMNS.length === 0) {
			return false;
		}
		const possibleKey: string[] = ["avg", "pass", "fail", "audit", "year",
			"dept", "id", "instructor", "title", "uuid"];
		if (q.TRANSFORMATIONS !== undefined) {
			for (const a of q.TRANSFORMATIONS.APPLY) {
				const keys = Object.keys(a);
				for (const key of keys) {
					possibleKey.push(key);
				}
			}
		}
		const ids: string[] = ["default"];
		for (const column of COLUMNS) {
			const underscoreIndex = column.indexOf("_");
			let idString;
			let mField;
			if (underscoreIndex !== -1) {
				idString = column.substring(0, underscoreIndex);
				mField = column.substring(underscoreIndex + 1);
			} else {
				idString = "default";
				mField = column;
			}

			for (let dataset of this.datasets) {
				ids.push(dataset.id);
			}
			if (this.initialMorSKey === "_") {
				this.initialMorSKey = idString;
			} else {
				if (this.initialMorSKey !== idString && idString !== "default") {
					return false;
				}
			}
			if (!ids.includes(idString)) {
				return false;
			}

			if(!possibleKey.includes(mField)) {
				return false;
			}
		}
		return true;
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

	public validateQuery(queryModel: Query) {
		if(queryModel.WHERE == null) {
			return false;
		} else if(queryModel.OPTIONS == null) {
			return false;
		} else {
			if (queryModel.TRANSFORMATIONS == null) {
				const isValid: boolean = this.validateQueryWhere(queryModel.WHERE) &&
					this.validateQueryOption(queryModel.OPTIONS, queryModel);
				this.initialMorSKey = "_";
				return isValid;
			}
			const validateTransformationHelper = new ValidateTransformationHelper();
			const isValid: boolean =
				this.validateQueryWhere(queryModel.WHERE) &&
				validateTransformationHelper.validateTransformation(queryModel.TRANSFORMATIONS, queryModel) &&
				this.validateQueryOption(queryModel.OPTIONS, queryModel);
			this.initialMorSKey = "_";
			return isValid;
		}
	}
}
