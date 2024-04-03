import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";

import {expect} from "chai";
import request, {Response} from "supertest";
import {clearDisk} from "../TestUtil";
import * as fs from "fs-extra";
import {describe} from "mocha";

describe("Facade D3", function () {

	let facade: InsightFacade;
	let server: Server;

	before(async function () {
		facade = new InsightFacade();
		server = new Server(4321);
		// TODO: start server here once and handle errors properly
		await clearDisk();
		server.start().catch((error) => {
			console.error(error);
		});
	});

	after(function () {
		// TODO: stop server here once!
		server.stop().catch((error) => {
			console.error(error);
		});
	});

	beforeEach(async function () {
		// might want to add some process logging here to keep track of what is going on
	});

	afterEach(async function () {
		// might want to add some process logging here to keep track of what is going on
	});

	it("Valid PUT test(sections)", async function () {
		try {
			const zip = await fs.readFile("test/resources/archives/pair.zip");

			return request("http://localhost:4321")
				.put("/dataset/sections/sections")
				.send(zip)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
					expect(res.body.result).to.have.deep.members(["sections"]);
				})
				.catch(function (err) {
					// some logging here please!
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
		}
	});

	it("Valid PUT test(rooms)", async function () {
		try {
			const zip = await fs.readFile("test/resources/archives/campus.zip");

			return request("http://localhost:4321")
				.put("/dataset/rooms/rooms")
				.send(zip)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
					expect(res.body.result).to.have.deep.members(["sections", "rooms"]);
				})
				.catch(function (err) {
					// some logging here please!
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
		}
	});

	it("Invalid PUT test for courses dataset(dataset already exist)", async function () {
		try {
			const zip = await fs.readFile("test/resources/archives/pair.zip");

			return request("http://localhost:4321")
				.put("/dataset/sections/sections")
				.send(zip)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					// some logging here please!
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
		}
	});

	it("Valid GET test", async function () {
		try {
			return request("http://localhost:4321")
				.get("/datasets")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
					expect(res.body.result).to.have.deep.members([
						{id: "rooms", kind: "rooms", numRows: 364},
						{id: "sections", kind: "sections", numRows: 64612}
					]);
				})
				.catch(function (err) {
					// some logging here please!
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
		}
	});

	describe("Valid POST tests", async function () {
		const fileNames = fs.readdirSync("test/resources/queries/valid");

		for (const fileName of fileNames) {
			const fileQuery = fs.readJSONSync(`test/resources/queries/valid/${fileName}`);

			it(`${fileQuery.title}`, function () {
				try {
					return request("http://localhost:4321")
						.post("/query")
						.send(fileQuery.input)
						.then(function (res: Response) {
							// some logging here please!
							expect(res.status).to.be.equal(200);
							expect(res.body.result).to.have.deep.members(fileQuery.expected);
						})
						.catch(function (err) {
							// some logging here please!
							console.log(err);
							expect.fail();
						});
				} catch (err) {
					// and some more logging here!
					console.log(err);
				}
			});
		}
	});

	describe("Invalid POST test", async function () {
		const fileNames = fs.readdirSync("test/resources/queries/invalid");

		for (const fileName of fileNames) {
			const fileQuery = fs.readJSONSync(`test/resources/queries/invalid/${fileName}`);

			it(`${fileQuery.title}`, function () {
				try {
					return request("http://localhost:4321")
						.post("/query")
						.send(fileQuery.input)
						.then(function (res: Response) {
							// some logging here please!
							expect(res.status).to.be.equal(400);
						})
						.catch(function (err) {
							// some logging here please!
							console.log(err);
							expect.fail();
						});
				} catch (err) {
					// and some more logging here!
					console.log(err);
				}
			});
		}
	});

	it("Valid POST test", async function () {
		try {
			const query = fs.readJSONSync("test/resources/queries/valid/complexQuery.json");

			return request("http://localhost:4321")
				.post("/query")
				.send(query.input)
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
					expect(res.body.result).to.have.deep.members(query.expected);
				})
				.catch(function (err) {
					// some logging here please!
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
		}
	});

	it("Invalid POST test", async function () {
		try {
			const query = await fs.readJSONSync("test/resources/queries/invalid/invalidApplySum.json");

			return request("http://localhost:4321")
				.post("/query")
				.send(query.input)
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					// some logging here please!
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
		}
	});

	it("Valid DELETE test(sections)", async function () {
		try {
			return request("http://localhost:4321")
				.delete("/dataset/sections")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
					expect(res.body.result).to.deep.equal("sections");
				})
				.catch(function (err) {
					// some logging here please!
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
		}
	});

	it("Valid DELETE test(rooms)", async function () {
		try {
			return request("http://localhost:4321")
				.delete("/dataset/rooms")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
					expect(res.body.result).to.deep.equal("rooms");
				})
				.catch(function (err) {
					// some logging here please!
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
		}
	});

	it("Invalid DELETE test(400)", async function () {
		try {
			return request("http://localhost:4321")
				.delete("/dataset/_")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					// some logging here please!
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
		}
	});

	it("Invalid DELETE test(404)", async function () {
		try {
			return request("http://localhost:4321")
				.delete("/dataset/sections")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(404);
				})
				.catch(function (err) {
					// some logging here please!
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
		}
	});
});
