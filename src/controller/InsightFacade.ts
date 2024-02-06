import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError
} from "./IInsightFacade";
import {getContentFromArchives} from "../../test/TestUtil";
import base = Mocha.reporters.base;

function containUnderscore(id: string) {
	for(let i = 0; i < id.length; i++) {
		if (id.charAt(i) === "_") {
			return true;
		}
	}
	return false;
}

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	constructor() {
		console.log("InsightFacadeImpl::init()");
	}

	private stringList: string[] = [];

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// see if id is valid
		if (id === "") {									// id is empty
			return Promise.reject(new InsightError());
		} else if (containUnderscore(id)) {					// id contains underscore
			return Promise.reject(new InsightError());
		} else if (id === " ") {							// id only contain white space
			return Promise.reject(new InsightError());
		} else if (this.stringList.includes(id)) {			// id already exist
			return Promise.reject(new InsightError());
		}

		// see if content is valid
		const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
		if (!base64Regex.test(content)) {					// content is not base 64 string
			return Promise.reject(new InsightError());
		}

		// return list if valid dataset is added
		{
			this.stringList.push(id);
		}
		return this.stringList;
	}

	public async removeDataset(id: string): Promise<string> {
		// check if id is valid
		if (id === "") {									// id is empty
			return Promise.reject(new InsightError());
		} else if (containUnderscore(id)) {					// id contains underscore
			return Promise.reject(new InsightError());
		} else if (id === " ") {							// id only contain white space
			return Promise.reject(new InsightError());
		}
		// check if id is in the list
		if (this.stringList.includes(id)) {			// id exists
			this.stringList = this.stringList.filter((item) => item !== id);
			return Promise.resolve(id);
		} else {
			return Promise.reject(new NotFoundError());
		}
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		return Promise.reject("Not implemented.");
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}
}
