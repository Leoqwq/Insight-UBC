import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError
} from "./IInsightFacade";
import jszip from "jszip";
import * as fs from "fs-extra";
import path from "path";
import {symlinkSync} from "fs";


/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export class Section {
	private readonly uuid: string;
	private readonly id: string;
	private readonly title: string;
	private readonly instructor: string;
	private readonly dept: string;
	private readonly year: number;
	private readonly avg: number;
	private readonly pass: number;
	private readonly fail: number;
	private readonly audit: number;

	constructor(uuid: string, id: string, title: string, instructor: string, dept: string, year: number, avg: number,
		pass: number, fail: number, audit: number) {
		this.uuid = uuid;
		this.id = id;
		this.title = title;
		this.instructor = instructor;
		this.dept = dept;
		this.year = year;
		this.avg = avg;
		this.pass = pass;
		this.fail = fail;
		this.audit = audit;
	}
}
interface Query {
	WHERE: Where;
	OPTIONS: Option;
}

interface Where {
	OR?: Where[];
	AND?: Where[];
	NOT?: Where;
	GT?: object;
	LT?: object;
	EQ?: object;
	IS?: object;
}

interface Negation {
	condition: Where;
}

interface Option {
	COLUMNS: string[];
	ORDER?: string;
}

export default class InsightFacade implements IInsightFacade {
	private readonly datasets: InsightDataset[];
	private readonly dataDir: string = "./data"; // Directory to store the processed datasets
	private initialMorSKey: string;
	private listOfMorSKey: string[] = [];

	constructor() {
		// eslint-disable-next-line max-len
		this.datasets = [{id: "sections", kind: InsightDatasetKind.Sections, numRows: 1},
			{id: "ubc", kind: InsightDatasetKind.Sections, numRows: 1}];
		this.initialMorSKey = "_";
		console.log("InsightFacadeImpl::init()");
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// Validate the id
		if (!id || id.trim().length === 0 || id.includes("_")) {
			throw new InsightError("Invalid id");
		}

		// Check if the dataset with the same id already exists
		for (let dataset of this.datasets) {
			if (dataset.id === id) {
				throw new InsightError("Dataset with the same id already exists");
			}
		}

		// Process and save the dataset
		const sections = await this.processZipFile(content);

		// 
    the data directory exists
		await fs.ensureDir(this.dataDir);

		// Save the processed data to disk
		const filePath = path.join(this.dataDir, `${id}.json`);
		await fs.writeJson(filePath, JSON.stringify(sections));

		// Add the datasets object
		this.datasets.push(
			{
				id,
				kind,
				numRows: sections.length
			}
		);

		// Return the list of currently added datasets
		const ids: string[] = [];

		for (let dataset of this.datasets) {
			ids.push(dataset.id);
		}

		return ids;
	}

	public async removeDataset(id: string): Promise<string> {
		// Validate the id
		if (!id || id.trim().length === 0 || id.includes("_")) {
			throw new InsightError("Invalid id");
		}

		// Check if the dataset with the specified id exists
		const datasetIndex = this.datasets.findIndex((dataset) => dataset.id === id);
		if (datasetIndex === -1) {
			throw new NotFoundError("Dataset not found");
		}

		try {
			// Remove dataset from memory
			this.datasets.splice(datasetIndex, 1);

			// Remove dataset from disk
			const filePath = path.join(this.dataDir, `${id}.json`);
			await fs.remove(filePath);

			return id;
		} catch (error: any) {
			// If any error occurs during removal, throw an InsightError
			throw new InsightError(`Failed to remove dataset ${id}: ${error.message}`);
		}
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		const queryModel: Query = query as Query;
		if (!this.validateQuery(queryModel)) {
			return Promise.reject(new InsightError());
		}
		return Promise.reject("not implemented");
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
		this.listOfMorSKey.push(mKey);
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
		this.listOfMorSKey.push(mKey);
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
		this.listOfMorSKey.push(mKey);
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
			this.listOfMorSKey.push(sKey);
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

	public validateQueryOption(optionBlock: Option): boolean {
		if (optionBlock.COLUMNS === undefined) {
			return false;
		} else {
			if (optionBlock.ORDER !== undefined) {
				return this.validateColumns(optionBlock.COLUMNS) &&
					this.validateOrder(optionBlock.ORDER, optionBlock.COLUMNS);
			}
			return this.validateColumns((optionBlock.COLUMNS));
			// eslint-disable-next-line max-lines
		}
	}

	public validateColumns(COLUMNS: string[]): boolean {
		if (COLUMNS.length === 0) {
			return false;
		}
		for (const column of COLUMNS) {
			if (!this.listOfMorSKey.includes(column)) {
				return false;
			}
		}
		return true;
	}

	public validateOrder(Order: string, COLUMNS: string[]): boolean {
		if (!COLUMNS.includes(Order)) {
			return false;
		}
		return true;
	}

	public validateQuery(queryModel: Query) {
		if(queryModel.WHERE == null) {
			return false;
		} else if(queryModel.OPTIONS == null) {
			return false;
		} else {
			const isValid: boolean = this.validateQueryWhere(queryModel.WHERE) &&
				this.validateQueryOption(queryModel.OPTIONS);
			this.initialMorSKey = "_";
			this.listOfMorSKey = [];
			return isValid;
		}
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		return Promise.resolve(this.datasets);
	}

	// Helpers
	private async processZipFile(zipContent: string): Promise<Section[]> {
		const zip = await jszip.loadAsync(zipContent, {base64: true});
		const sectionPromises: Array<Promise<Section[]>> = [];

		for (const [relativePath, file] of Object.entries(zip.files)) {
			if (file.dir) {
				// 
        courses directory
			} else {
				const sectionPromise = this.extractSections(file);
				sectionPromises.push(sectionPromise);
			}
		}

		// Use Promise.all to wait for all async calls to complete
		const sectionsArrays = await Promise.all(sectionPromises);

		// Flatten the array of arrays into a single array of sections
		const sections: Section[] = sectionsArrays.reduce((acc, val) => acc.concat(val), []);

		return sections;
	}

	private async extractSections(file: jszip.JSZipObject): Promise<Section[]> {
		// Parse the file content
		const fileContent = await file.async("string");

		// Parse the string into a JSON object
		const jsonObject = JSON.parse(fileContent);

		// Extract the "result" array from the JSON object
		const resultArray = jsonObject.result;

		const sections: Section[] = [];

		resultArray.forEach((obj: any, index: any) => {
			const uuid = obj.id;
			const id = obj.Course;
			const title = obj.Title;
			const instructor = obj.Professor;
			const dept = obj.Subject;
			const year = obj.Year;
			const avg = obj.Avg;
			const pass = obj.Pass;
			const fail = obj.Fail;
			const audit = obj.Audit;

			sections.push(new Section(uuid, id, title, instructor, dept, year, avg, pass, fail, audit));
		});

		return sections;
	}
}
