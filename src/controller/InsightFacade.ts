import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError, ResultTooLargeError
} from "./IInsightFacade";
import jszip from "jszip";
import * as fs from "fs-extra";
import path from "path";
import {symlinkSync} from "fs";
import ValidationHelpers, {Option, Query, Where} from "./QueryModel";
import ValidQueryHelpers from "./ValidQueryHelpers";


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

export default class InsightFacade implements IInsightFacade {
	private readonly datasets: InsightDataset[];
	private readonly dataDir: string = "./data"; // Directory to store the processed datasets
	private readonly validationHelpers: ValidationHelpers;
	private readonly validQueryHelpers: ValidQueryHelpers;

	constructor() {
		this.datasets = [];
		console.log("InsightFacadeImpl::init()");
		this.validationHelpers = new ValidationHelpers(this.datasets);
		this.validQueryHelpers = new ValidQueryHelpers();
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

		// Check dataset kind
		if (kind !== "sections") {
			throw new InsightError("Invalid dataset kind");
		}

		// Process and save the dataset
		const sections = await this.processZipFile(content);

		// Check there is at least one valid section in the dataset
		if (sections.length === 0) {
			throw new InsightError("No valid sections found in the dataset");
		}

		// Ensure the data directory exists
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

	public async listDatasets(): Promise<InsightDataset[]> {
		return Promise.resolve(this.datasets);
	}

	// Helpers
	private async processZipFile(zipContent: string): Promise<Section[]> {
		let zip: jszip;
		try {
			zip = await jszip.loadAsync(zipContent, {base64: true});
		} catch (e) {
			throw new InsightError("Not structured as a base64 string of a zip file");
		}
		const sectionPromises: Array<Promise<Section[]>> = [];

		for (const [relativePath, file] of Object.entries(zip.files)) {
			if (file.dir) {
				// Skip courses directory
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
		let jsonObject;
		try {
			jsonObject = JSON.parse(fileContent);
		} catch (e) {
			throw new InsightError("Not JSON formatted file");
		}

		// Extract the "result" array from the JSON object
		const resultArray = jsonObject.result;

		const sections: Section[] = [];

		resultArray.forEach((obj: any, index: any) => {
			// Check if any field is missing
			if (obj.id === undefined || obj.Course === undefined || obj.Title === undefined
				|| obj.Professor === undefined || obj.Subject === undefined || obj.Year === undefined
			|| obj.Avg === undefined || obj.Pass === undefined || obj.Fail === undefined
			|| obj.Audit === undefined) {
				return;
			}

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

			// Check for any casting error
			if (isNaN(year) || isNaN(avg) || isNaN(pass) || isNaN(fail) || isNaN(audit)) {
				return;
			}

			sections.push(new Section(uuid, id, title, instructor, dept, year, avg, pass, fail, audit));
		});

		return sections;
	}


	public async performQuery(query: unknown): Promise<InsightResult[]> {
		const queryModel: Query = query as Query;
		if (!this.validationHelpers.validateQuery(queryModel)) {
			return Promise.reject(new InsightError());
		}
		const targetDatasetId: string = this.validQueryHelpers.findDatasetId(queryModel);
		const filePath = path.join(this.dataDir, `${targetDatasetId}.json`);
		let data = await fs.readJson(filePath);
		data = JSON.parse(data);
		console.log(data[0]);
		const dataToBeReturned = this.validQueryHelpers.filterResult(queryModel, data);
		if (dataToBeReturned.length > 5000) {
			return Promise.reject(new ResultTooLargeError());
		}
		if (queryModel.OPTIONS.ORDER === undefined) {
			for (const d of dataToBeReturned) {
				console.log(d);
			}
			return dataToBeReturned;
		} else {
			const data1 = this.applyOrder(dataToBeReturned, queryModel.OPTIONS.ORDER, queryModel);
			for (const d of data1) {
				console.log(d);
			}
			return data1;
		}
	}

	public applyOrder(data: InsightResult[], order: string, queryModel: Query): InsightResult[] {
		switch (order) {
			case this.validQueryHelpers.findDatasetId(queryModel) + "_" + "audit":
			case this.validQueryHelpers.findDatasetId(queryModel) + "_" + "avg":
			case this.validQueryHelpers.findDatasetId(queryModel) + "_" + "year":
			case this.validQueryHelpers.findDatasetId(queryModel) + "_" + "pass":
			case this.validQueryHelpers.findDatasetId(queryModel) + "_" + "fail":
				return this.sortNumeric(data, order);
			case this.validQueryHelpers.findDatasetId(queryModel) + "_" + "uuid":
			case this.validQueryHelpers.findDatasetId(queryModel) + "_" + "dept":
			case this.validQueryHelpers.findDatasetId(queryModel) + "_" + "id":
			case this.validQueryHelpers.findDatasetId(queryModel) + "_" + "title":
			case this.validQueryHelpers.findDatasetId(queryModel) + "_" + "instructor":
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
