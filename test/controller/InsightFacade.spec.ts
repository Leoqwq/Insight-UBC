import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError, NotFoundError, ResultTooLargeError
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import {assert, expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
import {clearDisk, getContentFromArchives, readFileQueries} from "../TestUtil";
import {describe} from "mocha";

use(chaiAsPromised);

export interface ITestQuery {
	title: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}

describe("InsightFacade", function () {
	describe("addDataset", function() {
		let sections: string;
		let facade: InsightFacade;

		before(async function() {
			sections = await getContentFromArchives("cpsc_courses.zip");
		});

		beforeEach(async function() {
			await clearDisk();
			facade = new InsightFacade();
		});

		describe("Checking for valid ID argument to addDataset", function() {
			it ("should reject with an empty ID argument to addDataset", async function() {
				const result = facade.addDataset("", sections, InsightDatasetKind.Sections);
				const result2 = facade.listDatasets();

				return (await expect(result).to.eventually.be.rejectedWith(InsightError) &&
					expect(result2).to.eventually.deep.equal([]));
			});

			it ("should reject with ID argument is only a white space to addDataset", async function() {
				const result = facade.addDataset(" ", sections, InsightDatasetKind.Sections);
				const result2 = facade.listDatasets();

				return (await expect(result).to.eventually.be.rejectedWith(InsightError) &&
					expect(result2).to.eventually.deep.equal([]));
			});

			it ("should reject with ID argument '_' to addDataset", async function() {
				const result = facade.addDataset("_", sections, InsightDatasetKind.Sections);
				const result2 = facade.listDatasets();

				return (await expect(result).to.eventually.be.rejectedWith(InsightError) &&
					expect(result2).to.eventually.deep.equal([]));
			});

			it ("should reject with ID argument contains '_' to addDataset", async function() {
				const result = facade.addDataset("cpsc_courses", sections, InsightDatasetKind.Sections);
				const result2 = facade.listDatasets();

				return (await expect(result).to.eventually.be.rejectedWith(InsightError) &&
					expect(result2).to.eventually.deep.equal([]));
			});
		});

		describe("Checking for valid Content argument to addDataset", function() {
			it ("should reject with an invalid Dataset that is not structured as a base64 string of a zip file",
				async function() {
					const result = facade.addDataset("cpsc",
						"not_a_base_64_string_of_a zip_file", InsightDatasetKind.Sections);
					const result2 = facade.listDatasets();

					return (await expect(result).to.eventually.be.rejectedWith(InsightError) &&
					expect(result2).to.eventually.deep.equal([]));
				});

			it ("should reject with an invalid Dataset that is not in the form of a serialized zip file",
				async function() {
					const result = facade.addDataset("invalid",
						await getContentFromArchives("invalid_non_zip.json"), InsightDatasetKind.Sections);
					const result2 = facade.listDatasets();

					return (await expect(result).to.eventually.be.rejectedWith(InsightError) &&
					expect(result2).to.eventually.deep.equal([]));
				});

			it ("should reject with an invalid Dataset that is empty which contains no valid section",
				async function() {
					const result = facade.addDataset("invalid",
						await getContentFromArchives("invalid_empty.zip"), InsightDatasetKind.Sections);
					const result2 = facade.listDatasets();

					return (await expect(result).to.eventually.be.rejectedWith(InsightError) &&
					expect(result2).to.eventually.deep.equal([]));
				});

			it ("should reject with an invalid Dataset contains an invalid section missing field 'id'",
				async function() {
					const result = facade.addDataset("invalid",
						await getContentFromArchives("invalid_missing_field.zip"), InsightDatasetKind.Sections);
					const result2 = facade.listDatasets();

					return (await expect(result).to.eventually.be.rejectedWith(InsightError) &&
					expect(result2).to.eventually.deep.equal([]));
				});

			it ("should reject with an invalid Dataset contains an invalid section having incorrect format for " +
				"field 'year'", async function() {
				const result = facade.addDataset("invalid",
					await getContentFromArchives("invalid_incorrect_format.zip"), InsightDatasetKind.Sections);
				const result2 = facade.listDatasets();

				return (await expect(result).to.eventually.be.rejectedWith(InsightError) &&
					expect(result2).to.eventually.deep.equal([]));
			});

			it ("should reject with an invalid Dataset contains a course that is not JSON formatted file",
				async function() {
					const result = facade.addDataset("invalid",
						await getContentFromArchives("invalid_JSON_syntax.zip"), InsightDatasetKind.Sections);
					const result2 = facade.listDatasets();

					return (await expect(result).to.eventually.be.rejectedWith(InsightError) &&
					expect(result2).to.eventually.deep.equal([]));
				});

			// it ("should reject with an invalid Dataset contains a course not within a folder called courses/ in the zip's root directory. ", async function() {
			//     const result = facade.addDataset("invalid", await getContentFromArchives("invalid_nested_courses_folder.zip"), InsightDatasetKind.Sections);
			//
			//     return expect(result).to.eventually.be.rejectedWith(InsightError);
			// });
		});

		describe("Checking for valid Kind argument to addDataset", function() {
			it ("should reject with Kind argument other than 'sections'", async function() {
				const result = facade.addDataset("cpsc", sections, InsightDatasetKind.Rooms);
				const result2 = facade.listDatasets();

				return (await expect(result).to.eventually.be.rejectedWith(InsightError) &&
					expect(result2).to.eventually.deep.equal([]));
			});
		});

		describe("Checking for already exist dataset", function() {
			it ("should reject when trying to add dataset with ID = 'cpsc' twice", async function() {
				await facade.addDataset("cpsc", sections, InsightDatasetKind.Sections);
				const result = facade.addDataset("cpsc", sections, InsightDatasetKind.Sections);
				const result2 = facade.listDatasets();

				return (await expect(result).to.eventually.be.rejectedWith(InsightError) &&
					expect(result2).to.eventually.deep.equal([
						{
							id: "cpsc",
							kind: InsightDatasetKind.Sections,
							numRows: 4
						}
					]));
			});
		});

		describe("Checking for successful addDataset", function() {
			it ("should successfully add a dataset (first)", function() {
				const result = facade.addDataset("cpsc", sections, InsightDatasetKind.Sections);

				return expect(result).to.eventually.have.members(["cpsc"]);

			});

			it ("should successfully add a dataset (second)", function() {
				const result = facade.addDataset("cpsc", sections, InsightDatasetKind.Sections);

				return expect(result).to.eventually.have.members(["cpsc"]);
			});
		});
	});

	describe("removeDataset", function() {
		let cpscSections: string;
		let mathSections: string;
		let pyscSections: string;
		let statSections: string;
		let facade: InsightFacade;

		before(async function() {
			cpscSections = await getContentFromArchives("cpsc_courses.zip");
			mathSections = await getContentFromArchives("math_courses.zip");
			pyscSections = await getContentFromArchives("pysc_courses.zip");
			statSections = await getContentFromArchives("stat_courses.zip");
		});

		beforeEach(async function() {
			await clearDisk();
			facade = new InsightFacade();
			await facade.addDataset("cpsc", cpscSections, InsightDatasetKind.Sections);
			await facade.addDataset("math", mathSections, InsightDatasetKind.Sections);
			await facade.addDataset("pysc", pyscSections, InsightDatasetKind.Sections);
			await facade.addDataset("stat", statSections, InsightDatasetKind.Sections);
		});

		describe("Checking for valid ID argument to removeDataset", function() {
			it ("should reject with an empty ID argument to removeDataset", async function () {
				const result = facade.removeDataset("");
				const result2 = facade.listDatasets();

				return (await expect(result).to.eventually.be.rejectedWith(InsightError)
					&& expect(result2).to.eventually.deep.equal([
						{
							id: "cpsc",
							kind: InsightDatasetKind.Sections,
							numRows: 4
						},
						{
							id: "math",
							kind: InsightDatasetKind.Sections,
							numRows: 2
						},
						{
							id: "pysc",
							kind: InsightDatasetKind.Sections,
							numRows: 2
						},
						{
							id: "stat",
							kind: InsightDatasetKind.Sections,
							numRows: 1
						}
					]));
			});

			it ("should reject with ID argument is only a white space to removeDataset", async function () {
				const result = facade.removeDataset(" ");
				const result2 = facade.listDatasets();

				return (await expect(result).to.eventually.be.rejectedWith(InsightError)
					&& expect(result2).to.eventually.deep.equal([
						{
							id: "cpsc",
							kind: InsightDatasetKind.Sections,
							numRows: 4
						},
						{
							id: "math",
							kind: InsightDatasetKind.Sections,
							numRows: 2
						},
						{
							id: "pysc",
							kind: InsightDatasetKind.Sections,
							numRows: 2
						},
						{
							id: "stat",
							kind: InsightDatasetKind.Sections,
							numRows: 1
						}
					]));
			});

			it ("should reject with ID argument '_' to removeDataset", async function() {
				const result = facade.removeDataset("_");
				const result2 = facade.listDatasets();

				return (await expect(result).to.eventually.be.rejectedWith(InsightError)
					&& expect(result2).to.eventually.deep.equal([
						{
							id: "cpsc",
							kind: InsightDatasetKind.Sections,
							numRows: 4
						},
						{
							id: "math",
							kind: InsightDatasetKind.Sections,
							numRows: 2
						},
						{
							id: "pysc",
							kind: InsightDatasetKind.Sections,
							numRows: 2
						},
						{
							id: "stat",
							kind: InsightDatasetKind.Sections,
							numRows: 1
						}
					]));
			});

			it ("should reject with ID argument contains '_' to removeDataset", async function() {
				const result = facade.removeDataset("cpsc_course");
				const result2 = facade.listDatasets();

				return (await expect(result).to.eventually.be.rejectedWith(InsightError)
					&& expect(result2).to.eventually.deep.equal([
						{
							id: "cpsc",
							kind: InsightDatasetKind.Sections,
							numRows: 4
						},
						{
							id: "math",
							kind: InsightDatasetKind.Sections,
							numRows: 2
						},
						{
							id: "pysc",
							kind: InsightDatasetKind.Sections,
							numRows: 2
						},
						{
							id: "stat",
							kind: InsightDatasetKind.Sections,
							numRows: 1
						}
					]));
			});

			it ("should reject with an ID that does not exist", async function() {
				const result = facade.removeDataset("biol");
				const result2 = facade.listDatasets();

				return (await expect(result).to.eventually.be.rejectedWith(NotFoundError)
					&& expect(result2).to.eventually.deep.equal([
						{
							id: "cpsc",
							kind: InsightDatasetKind.Sections,
							numRows: 4
						},
						{
							id: "math",
							kind: InsightDatasetKind.Sections,
							numRows: 2
						},
						{
							id: "pysc",
							kind: InsightDatasetKind.Sections,
							numRows: 2
						},
						{
							id: "stat",
							kind: InsightDatasetKind.Sections,
							numRows: 1
						}
					]));
			});
		});

		describe("Checking for successful removeDataset", function() {
			it ("should successfully remove a dataset", async function() {
				const result = facade.removeDataset("cpsc");
				const result2 = facade.listDatasets();

				return (await expect(result).to.eventually.deep.equal("cpsc") &&
					expect(result2).to.eventually.deep.equal([
						{
							id: "math",
							kind: InsightDatasetKind.Sections,
							numRows: 2
						},
						{
							id: "pysc",
							kind: InsightDatasetKind.Sections,
							numRows: 2
						},
						{
							id: "stat",
							kind: InsightDatasetKind.Sections,
							numRows: 1
						}
					]));
			});
		});
	});

	describe("listDatasets", function() {
		describe("Checking for successful listDatasets", function() {
			let facade: InsightFacade;
			let cpscSections: string;
			let mathSections: string;
			let pyscSections: string;
			let statSections: string;

			before(async function() {
				cpscSections = await getContentFromArchives("cpsc_courses.zip");
				mathSections = await getContentFromArchives("math_courses.zip");
				pyscSections = await getContentFromArchives("pysc_courses.zip");
				statSections = await getContentFromArchives("stat_courses.zip");
			});

			beforeEach(async function() {
				await clearDisk();
				facade = new InsightFacade();
			});

			it ("should successfully fulfill promise by an empty array", function() {
				const result = facade.listDatasets();

				return (expect(result).to.eventually.deep.equal([]));
			});

			it ("should successfully fulfill promise by an array of currently added InsightDatasets", async function() {
				await facade.addDataset("cpsc", cpscSections, InsightDatasetKind.Sections);
				await facade.addDataset("math", mathSections, InsightDatasetKind.Sections);
				await facade.addDataset("pysc", pyscSections, InsightDatasetKind.Sections);
				await facade.addDataset("stat", statSections, InsightDatasetKind.Sections);

				const result = facade.listDatasets();

				return (expect(result).to.eventually.deep.equal([
					{
						id: "cpsc",
						kind: InsightDatasetKind.Sections,
						numRows: 4
					},
					{
						id: "math",
						kind: InsightDatasetKind.Sections,
						numRows: 2
					},
					{
						id: "pysc",
						kind: InsightDatasetKind.Sections,
						numRows: 2
					},
					{
						id: "stat",
						kind: InsightDatasetKind.Sections,
						numRows: 1
					}
				]));
			});
		});
	});

	describe("performQuery", function() {
		let sections: string;
		let cpscSections: string;
		let facade: InsightFacade;

		before(async function() {
			await clearDisk();
			sections = await getContentFromArchives("pair.zip");
			cpscSections = await getContentFromArchives("cpsc_courses.zip");
			facade = new InsightFacade();
			await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
			await facade.addDataset("cpsc", cpscSections, InsightDatasetKind.Sections);
		});

		describe("Checking for valid query argument to performQuery", function() {
			it ("should reject query that is not an 'object' type", function() {
				const result = facade.performQuery(null);

				return (expect(result).to.eventually.be.rejectedWith(InsightError));
			});
		});

		describe("valid queries", function() {
			let validQueries: ITestQuery[];
			try {
				validQueries = readFileQueries("valid");
			} catch (e: unknown) {
				expect.fail(`Failed to read one or more test queries. ${e}`);
			}

			validQueries.forEach(function(test: any) {
				it(`${test.title}`, function () {
					return facade.performQuery(test.input).then((result) => {
						expect(result).to.have.deep.members(test.expected);
					}).catch((err: string) => {
						assert.fail(`performQuery threw unexpected error: ${err}`);
					});
				});
			});
		});

		describe("invalid queries", function() {
			let invalidQueries: ITestQuery[];
			try {
				invalidQueries = readFileQueries("invalid");

			} catch (e: unknown) {
				expect.fail(`Failed to read one or more test queries. ${e}`);
			}

			invalidQueries.forEach(function(test: any) {
				it(`${test.title}`, function () {
					return facade.performQuery(test.input).then((result) => {
						assert.fail("performQuery did not return insightError on invalid queries");
					}).catch((err: string) => {
						if (test.expected === "InsightError") {
							expect(err).to.be.an.instanceof(InsightError);
						} else if (test.expected === "ResultTooLargeError"){
							expect(err).to.be.an.instanceof(ResultTooLargeError);
						}
					});
				});
			});
		});
	});
});
