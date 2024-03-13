import {Section} from "./InsightFacade";
import jszip from "jszip";
import {InsightError} from "./IInsightFacade";

export default class AddSectionDatasetHelpers {
	public async processSectionZipFile(zipContent: string): Promise<Section[]> {
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
		const sectionsArray = await Promise.all(sectionPromises);

		// Flatten the array of arrays into a single array of sections
		const sections: Section[] = sectionsArray.reduce((acc, val) => acc.concat(val), []);

		return sections;
	}

	public async extractSections(file: jszip.JSZipObject): Promise<Section[]> {
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
}
