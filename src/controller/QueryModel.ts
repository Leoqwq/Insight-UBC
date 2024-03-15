import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {CompoundOrder, Option, Query, Where} from "./QueryStructure";
import {ValidateTransformationHelper} from "./ValidateTransformationHelper";
import {query} from "express";
import {GeneralHelpers} from "./GeneralHelpers";

export default class ValidationHelpers {
	private generalHelpers = new GeneralHelpers();
	private datasets: InsightDataset[];
	public initialMorSKey: string = "_";
	constructor(datasets: InsightDataset[]) {
		this.datasets = datasets;
	}

	public validateAnd(AND: Where[], q: Query) {
		if (AND.length === 0) {
			return false;
		} else {
			for (const item of AND) {
				if (!this.validateQueryWhere(item, q)) {
					return false;
				}
			}
		}
		return true;
	}

	public validateOr(OR: Where[], q: Query): boolean {
		if (OR.length === 0) {
			return false;
		} else {
			for (const item of OR) {
				if (!this.validateQueryWhere(item, q)) {
					return false;
				}
			}
		}
		return true;
	}

	public validateNot(NOT: Where, q: Query): boolean {
		if (Object.keys(NOT).length !== 1) {
			return false;
		}
		return this.validateQueryWhere(NOT, q);
	}

	public validateGT(GT: object, q: Query) {
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
		const possibleMField: string[] = this.generalHelpers.assignMField(q, this.datasets);
		if (possibleMField.length === 0) {
			return false;
		}
		if (!possibleMField.includes(mField)) {
			return false;
		}
		if (typeof (GT as any)[mKey] !== "number") {
			return false;
		}
		return true;
	}

	public validateLT(LT: object, q: Query) {
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
		const possibleMField: string[] = this.generalHelpers.assignMField(q, this.datasets);
		if (possibleMField.length === 0) {
			return false;
		}
		if(!possibleMField.includes(mField)) {
			return false;
		}
		if (typeof (LT as any)[mKey] !== "number") {
			return false;
		}
		return true;
	}

	public validateEQ(EQ: object, q: Query) {
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
		const possibleMField: string[] = this.generalHelpers.assignMField(q, this.datasets);
		if(!possibleMField.includes(mField)) {
			return false;
		}
		if (typeof (EQ as any)[mKey] !== "number") {
			return false;
		}
		return true;
	}

	public validateIS(IS: object, q: Query) {
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
			const possibleSField: string[] = this.generalHelpers.assignSField(q, this.datasets);
			if (possibleSField.length === 0) {
				return false;
			}
			if (possibleSField.length === 0) {
				return false;
			}
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

	public validateQueryWhere(whereBlock: Where, q: Query): boolean {
		if (whereBlock.AND !== undefined) {
			return this.validateAnd(whereBlock.AND, q);
		} else if (whereBlock.OR !== undefined) {
			return this.validateOr(whereBlock.OR, q);
		} else if (whereBlock.NOT !== undefined) {
			return this.validateNot(whereBlock.NOT, q);
		} else if (whereBlock.GT !== undefined) {
			return this.validateGT(whereBlock.GT, q);
		} else if (whereBlock.LT !== undefined) {
			return this.validateLT(whereBlock.LT, q);
		} else if (whereBlock.EQ !== undefined) {
			return this.validateEQ(whereBlock.EQ, q);
		} else if (whereBlock.IS !== undefined) {
			return this.validateIS(whereBlock.IS, q);
		} else if (Object.keys(whereBlock).length === 0) {
			return true;
		}
		return false;
	}

	public validateQueryOption(optionBlock: Option, q: Query): boolean {
		const generalHelpers = new GeneralHelpers();
		if (optionBlock.COLUMNS === undefined) {
			return false;
		} else {
			if (optionBlock.ORDER !== undefined && typeof (optionBlock.ORDER) === "string") {
				return this.validateColumns(optionBlock.COLUMNS, q) &&
					generalHelpers.validateOrderSimple(optionBlock.ORDER, optionBlock.COLUMNS);
			} else if (optionBlock.ORDER !== undefined && typeof (optionBlock.ORDER) === "object") {
				return generalHelpers.validateOrderComplex(optionBlock.ORDER, optionBlock.COLUMNS) &&
					this.validateColumns(optionBlock.COLUMNS, q);
			}
			return this.validateColumns(optionBlock.COLUMNS, q);
		}
	}

	public validateColumns(COLUMNS: string[], q: Query): boolean {
		if (COLUMNS.length === 0) {
			return false;
		}
		const possibleKey = this.generalHelpers.assignKeys(q, this.datasets);
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

	public validateQuery(queryModel: Query) {
		if(queryModel.WHERE == null) {
			this.initialMorSKey = "_";
			return false;
		} else if(queryModel.OPTIONS == null) {
			this.initialMorSKey = "_";
			return false;
		} else {
			if (queryModel.TRANSFORMATIONS == null) {
				const isValid: boolean = this.validateQueryWhere(queryModel.WHERE, queryModel) &&
					this.validateQueryOption(queryModel.OPTIONS, queryModel);
				this.initialMorSKey = "_";
				return isValid;
			}
			const validateTransformationHelper = new ValidateTransformationHelper(this.datasets);
			const isValid: boolean =
				this.validateQueryWhere(queryModel.WHERE, queryModel) &&
				validateTransformationHelper.validateTransformation(queryModel.TRANSFORMATIONS, queryModel) &&
				this.validateQueryOption(queryModel.OPTIONS, queryModel);
			this.initialMorSKey = "_";
			return isValid;
		}
	}
}
