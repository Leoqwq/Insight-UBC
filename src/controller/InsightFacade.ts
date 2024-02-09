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
}

type Filter = LogicComparison | MComparison | SComparison | Negation;

interface LogicComparison {
	logic: "AND" | "OR";
	conditions: Filter[];
}

interface MComparison {
	comparator: "LT" | "GT" | "EQ";
	mkey: string;
	number: number;
}

interface SComparison {
	skey: string;
	inputString: string;
}

interface Negation {
	condition: Filter;
}

interface Option {
	COLUMNS: string[];
	ORDER?: string[];
}

function validateQuery(queryModel: Query) {
	if(queryModel.WHERE == null) {
		return false;
	} else if(queryModel.OPTIONS == null) {
		return false;
	} else if(queryModel.OPTIONS.COLUMNS == null) {
		return false;
	} else if(queryModel.WHERE.AND?.length === 0) {
		return false;
	} else if(queryModel.WHERE.OR?.length === 0) {
		return false;
	} else {
		console.log("where:");
		console.log(queryModel.WHERE);
		console.log("options:");
		console.log(queryModel.OPTIONS);
		console.log("and?");
		console.log(queryModel.WHERE.AND);
		console.log("or?");
		console.log(queryModel.WHERE.OR);
		return true;
	}
}

export default class InsightFacade implements IInsightFacade {
	private readonly datasets: InsightDataset[];
	private readonly dataDir: string = "./data"; // Directory to store the processed datasets

	constructor() {
		this.datasets = [];
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
		if (!validateQuery(queryModel)) {
			return Promise.reject(new InsightError());
		}
		return Promise.reject("not implemented");
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		return Promise.resolve(this.datasets);
	}

	// Helpers
	private async processZipFile(zipContent: string): Promise<Section[]> {
		const zip = await jszip.loadAsync(zipContent, {base64: true});
		const sectionPromises: Array<Promise<Section[]>> = [];

		for (const [relativePath, file] of Object.entries(zip.files)) {
			const sectionPromise = this.extractSections(file);
			sectionPromises.push(sectionPromise);
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

		console.log(resultArray);

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
