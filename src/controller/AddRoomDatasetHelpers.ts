import jszip from "jszip";
import {InsightError} from "./IInsightFacade";
import * as parse5 from "parse5";
import {ChildNode, Element, TextNode} from "parse5/dist/tree-adapters/default";
import {Building, Room, Section} from "./InsightFacade";
import * as http from "http";

interface GeoResponse {
	lat?: number;
	lon?: number;
	error?: string;
}

export default class AddRoomDatasetHelpers {
	public async processRoomZipFile(zipContent: string): Promise<Room[]> {
		let zip: jszip;
		try {
			zip = await jszip.loadAsync(zipContent, {base64: true});
		} catch (e) {
			throw new InsightError("Not structured as a base64 string of a zip file");
		}

		// Parse all buildings in index.htm into JSON objects
		let buildingsPromise: Promise<Building[]> = Promise.resolve([]);

		for (const [relativePath, file] of Object.entries(zip.files)) {
			if (file.name === "index.htm") {
				buildingsPromise = this.extractBuildings(file);
			}
		}

		if(buildingsPromise === undefined) {
			throw new InsightError("No buildings were found!");
		}

		// Set the geolocation for each building
		const buildings = await buildingsPromise;

		const promises: Array<Promise<void>> = [];

		for (const building of buildings) {
			try {
				promises.push(this.setGeolocation(building));
			} catch(e) {
				buildings.splice(buildings.indexOf(building), 1);
			}
		}

		await Promise.all(promises);

		// Parse all rooms contained in campus/discover/buildings-and-classrooms into JSON objects
		let roomsPromises: Array<Promise<Room[]>> = [];

		for (const building of buildings) {
			for (const [relativePath, file] of Object.entries(zip.files)) {
				const absolutePath = "./" + relativePath;
				if (absolutePath === building.pathToRooms) {
					roomsPromises.push(this.extractRooms(file, building));
				}
			}
		}

		const roomsArray = await Promise.all(roomsPromises);

		// Flatten the array of arrays into a single array of rooms
		const rooms: Room[] = roomsArray.reduce((acc, val) => acc.concat(val), []);

		return rooms;
	}

	public async extractBuildings(file: jszip.JSZipObject): Promise<Building[]> {
		const fileContent = await file.async("string");

		let jsonObject;
		try {
			jsonObject = parse5.parse(fileContent);
		} catch (e) {
			throw new InsightError("Not JSON formatted file");
		}

		// Find the table containing buildings' information in index.htm
		let tbody: any = null;

		for (const node of jsonObject.childNodes) {
			if(this.findTable(node)) {
				tbody = this.findTable(node);
				break;
			}
		}

		if (tbody === null) {
			throw new InsightError("No buildings found in index.htm");
		}

		// Parse and return the table found into buildings
		return this.tableToBuildings(tbody);
	}

	public tableToBuildings(tbody: ChildNode): Building[]{
		const buildings: Building[] = [];

		// Iterate through each row of tbody and extract information of each building
		for (const tr of (tbody as Element).childNodes) {
			let fullname = null;
			let shortname = null;
			let address = null;
			let pathToRooms = null;

			if (tr.nodeName === "tr") {
				for (const td of (tr as Element).childNodes) {
					if (td.nodeName === "td") {
						const classType: string = (td as Element).attrs[0].value;

						if (classType === "views-field views-field-field-building-code") {
							for (const childNode of (td as Element).childNodes) {
								if (childNode.nodeName === "#text") {
									shortname = ((childNode as TextNode).value).trim();
								}
							}
						} else if (classType === "views-field views-field-title") {
							for (const childNode of (td as Element).childNodes) {
								if (childNode.nodeName === "a" && childNode.childNodes[0].nodeName === "#text") {
									fullname = (childNode.childNodes[0] as TextNode).value;
								}
							}
						} else if (classType === "views-field views-field-field-building-address") {
							for (const childNode of (td as Element).childNodes) {
								if (childNode.nodeName === "#text") {
									address = ((childNode as TextNode).value).trim();
								}
							}

						} else if (classType === "views-field views-field-nothing") {
							for (const childNode of (td as Element).childNodes) {
								if (childNode.nodeName === "a" && childNode.attrs[0].name === "href") {
									pathToRooms = childNode.attrs[0].value;
								}
							}
						} else {
							continue;
						}

						// Validation
						if (fullname !== null && shortname !== null && address !== null && pathToRooms !== null) {
							buildings.push(new Building(fullname, shortname, address, pathToRooms));
						}
					}
				}
			}
		}

		return buildings;
	}

	public async extractRooms(file: jszip.JSZipObject, building: Building): Promise<Room[]> {
		const fileContent = await file.async("string");

		let jsonObject;
		try {
			jsonObject = parse5.parse(fileContent);
		} catch (e) {
			throw new InsightError("Not JSON formatted file");
		}

		// Find the table containing rooms' information in the provided parameter 'file'
		let tbody: any = null;

		for (const node of jsonObject.childNodes) {
			if(this.findTable(node)) {
				tbody = this.findTable(node);
				break;
			}
		}

		if (tbody === null) {
			return Promise.resolve([]);
		}

		// Parse and return the table found into rooms
		return this.tableToRooms(tbody, building);
	}

	public tableToRooms(tbody: ChildNode, building: Building): Room[] {
		const rooms: Room[] = [];

		// Iterate through each row in tbody and extract information of each room
		for (const tr of (tbody as Element).childNodes) {
			let number = null;
			let seats = null;
			let type = null;
			let furniture = null;
			let href = null;

			if (tr.nodeName === "tr") {
				for (const td of (tr as Element).childNodes) {
					if (td.nodeName === "td") {
						const classType: string = (td as Element).attrs[0].value;

						if (classType === "views-field views-field-field-room-number") {
							for (const childNode of (td as Element).childNodes) {
								if (childNode.nodeName === "a" && childNode.childNodes[0].nodeName === "#text") {
									number = (childNode.childNodes[0] as TextNode).value;
								}
							}
						} else if (classType === "views-field views-field-field-room-capacity") {
							for (const childNode of (td as Element).childNodes) {
								seats = parseInt((childNode as TextNode).value, 10);
							}
						} else if (classType === "views-field views-field-field-room-furniture") {
							for (const childNode of (td as Element).childNodes) {
								furniture = ((childNode as TextNode).value).trim();
							}
						} else if (classType === "views-field views-field-field-room-type") {
							for (const childNode of (td as Element).childNodes) {
								type = ((childNode as TextNode).value).trim();
							}
						} else if (classType === "views-field views-field-nothing") {
							for (const childNode of (td as Element).childNodes) {
								if (childNode.nodeName === "a" && childNode.attrs[0].name === "href") {
									href = childNode.attrs[0].value;
								}
							}
						}

						// Validation
						if (number !== null  && seats !== null && type !== null && furniture !== null
							&& href !== null) {
							const name = building.shortname + "_" + number;
							rooms.push(new Room(building.fullname, building.shortname, number, name, building.address,
								building.lat, building.lon, seats, type, furniture, href));
						}
					}
				}
			}
		}
		return rooms;
	}

	public findTable(node: ChildNode): ChildNode | null{
		// Check if current node is a valid table that contains information about rooms or buildings
		if (node.nodeName === "table") {
			for (const tbody of node.childNodes) {
				if (tbody.nodeName === "tbody") {
					for (const tr of tbody.childNodes) {
						if (tr.nodeName === "tr") {
							for (const td of tr.childNodes) {
								if (td.nodeName === "td") {
									for (const attribute of td.attrs) {
										if (attribute.name === "class" &&
											attribute.value === "views-field views-field-nothing") {
											return tbody;
										}
									}
								}
							}
						}
					}
				}
			}
		}

		// Perform findTable on every childNodes of current node
		if ((node as Element).childNodes) {
			for (const childNode of (node as Element).childNodes) {
				const foundNode = this.findTable(childNode);
				if (foundNode) {
					return foundNode;
				}
			}
		}

		return null;
	}

	public async setGeolocation(building: Building) {
		// Make http request to get longitude and latitude of the given building
		const encodedAddress = encodeURIComponent(building.address);
		const url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team122/" + encodedAddress;

		const response = await new Promise<string>((resolve, reject) => {
			http.get(url, (res) => {
				let data = "";
				res.on("data", (chunk) => {
					data += chunk;
				});
				res.on("end", () => {
					resolve(data);
				});
			}).on("error", (error) => {
				reject(error);
			});
		});

		const responseData: GeoResponse = JSON.parse(response);

		// Set the geolocation of given building
		if (responseData.error) {
			throw new InsightError(responseData.error);
		} else {
			building.lat = responseData.lat || -1;
			building.lon = responseData.lon || -1;
		}
	}
}


