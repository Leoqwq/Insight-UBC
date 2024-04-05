// document.getElementById("click-me-button").addEventListener("click", handleClickMe);
const addDatasetForm = document.getElementById("add-dataset-form");
const datasetIdInput = document.getElementById("dataset-id-input");
const datasetFileInput = document.getElementById("dataset-file-input");
const removeDatasetButton = document.getElementById("remove-dataset-button");
const datasetIdInputRem = document.getElementById("dataset-id-input-remove");
const viewDatasetsButton = document.getElementById("view-dataset-button");
const viewInsightsButton = document.getElementById("view-insight-button");
const datasetInputView = document.getElementById("dataset-id-input-insight");

viewInsightsButton.addEventListener("click", function() {
	const graphContainer = document.getElementById("graph-container");
	graphContainer.innerHTML = "";
	const id = datasetInputView.value;
	if (!id) {
		alert("Please enter a dataset ID")
		return;
	}

	const q1 = {
		"WHERE": {
			"LT": {
				[id + "_avg"]: 50
			}
		},
		"OPTIONS": {

			"COLUMNS": [
				id + "_title",
				"count"
			]
		},
		"TRANSFORMATIONS": {
			"GROUP": [
				id + "_title"
			],
			"APPLY": [
				{
					"count": {
						"COUNT": id + "_uuid"
					}
				}
			]
		}
	}

	const q2 = {
		"WHERE": {
			"GT": {
				[id + "_avg"]: 97
			}
		},
		"OPTIONS": {

			"COLUMNS": [
				id + "_title",
				"count"
			]
		},
		"TRANSFORMATIONS": {
			"GROUP": [
				id + "_title"
			],
			"APPLY": [
				{
					"count": {
						"COUNT": id + "_uuid"
					}
				}
			]
		}
	}

	const q3 = {
		"WHERE": {
			"GT": {
				[id + "_year"]: 2000
			}
		},
		"OPTIONS": {

			"COLUMNS": [
				id + "_year",
				"overallAvg"
			]
		},
		"TRANSFORMATIONS": {
			"GROUP": [
				id + "_year"
			],
			"APPLY": [
				{
					"overallAvg": {
						"AVG": id + "_avg"
					}
				}
			]
		}
	}

	fetch("/query", {
		method: "post",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(q1)
	}).then(r => {
		if (!r.ok) {
			throw new Error("Failed to view insight on dataset " + id);
		}
		return r.json();
	}).then(data => {
		const result1 = data.result;
		const note1 = document.createElement("p");
		note1.innerHTML = "Each bar in this graph represents a course, the value of each bar represents the number " +
			"of times that course had an average grade lower than 50%";
		graphContainer.appendChild(note1);
		const svgNode = createBarGraphs(result1, id);
		graphContainer.appendChild(svgNode);
	}).catch(e => {
		alert("Error: " + e.message);
	});

	fetch("/query", {
		method: "post",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(q2)
	}).then(r => {
		if (!r.ok) {
			throw new Error("Failed to view insight on dataset " + id);
		}
		return r.json();
	}).then(data => {
		const result2 = data.result;
		const note2 = document.createElement("p");
		note2.innerHTML = "Each bar in this graph represents a course, the value of each bar represents the number " +
			"of times that course had an average grade higher than 97%";
		graphContainer.appendChild(note2);
		const svgNode = createBarGraphs(result2, id);
		graphContainer.appendChild(svgNode);
	}).catch(e => {
		alert("Error: " + e.message);
	});

	fetch("/query", {
		method: "post",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(q3)
	}).then(r => {
		if (!r.ok) {
			throw new Error("Failed to view insight on dataset " + id);
		}
		return r.json();
	}).then(data => {
		const result3 = data.result;
		const note3 = document.createElement("p");
		note3.innerHTML = "This graph shows the trend for the overall average of all courses from year 2006 to 2017";
		graphContainer.appendChild(note3);
		const svgNode = createLineGraph(result3, id);
		graphContainer.appendChild(svgNode);
	}).catch(e => {
		alert("Error: " + e.message);
	});

});
removeDatasetButton.addEventListener("click", function () {
	const id = datasetIdInputRem.value;

	if (!id) {
		alert("Please enter a dataset ID");
		return;
	}

	fetch("/dataset/" + id, {
		method: "delete"
	}).then(response => {
		if (!response.ok) {
			throw new Error("Failed to remove dataset");
		}
	}).then(data => {
		alert(`Dataset ${id} removed successfully!`);
		updateList();
	}).catch(error => {
		alert("Error: " + error.message);
	});
});

viewDatasetsButton.addEventListener("click", function () {

	fetch("/datasets", {
		method: "get"
	}).then(response => {
		if (!response.ok) {
			throw new Error("Failed to get datasets");
		}
		return response.json();
	}).then(datasets => {
		const results = datasets.result;
		showResults(results);
	}).catch(error => {
		alert("Error: " + error.message);
	});
});

function updateList() {

	fetch("/datasets", {
		method: "get"
	}).then(response => {
		if (!response.ok) {
			throw new Error("Failed to get datasets");
			return;
		}
		return response.json();
	}).then(datasets => {
		const results = datasets.result;
		showResults(results);
	}).catch(error => {
		alert("Error: " + error.message);
	});
}
addDatasetForm.addEventListener("submit", e => {
	e.preventDefault();
	const id = datasetIdInput.value;
	const file = datasetFileInput.files[0];
	if (!id || !file) {
		alert("Please enter a dataset ID and select a file.");
		return;
	}
	// const formData = new FormData();
	// formData.append("zipFile", file);

	fetch("/dataset/" + id + "/sections", {
		method: "put",
		body: file,

	}).then(response => {
		if (!response.ok) {
			throw new Error("Failed to add dataset.");
		}
		return response.json();
	}).then(data => {
		alert(`Dataset ${id} added successfully!`);
		updateList();
	}).catch(error => {
		alert("Error: " + error.message);
	});
});

function showResults(results) {
	const datasetList = document.getElementById("dataset-list");
	datasetList.innerHTML = "Existing Dataset IDs: ";
	if (results.length === 0) {
		const listItem = document.createElement("li");
		listItem.textContent = "No available dataset to show";
		datasetList.appendChild(listItem);
	}
	results.forEach(result => {
		const listItem = document.createElement("li");
		listItem.textContent = result.id;
		datasetList.appendChild(listItem);
	});
}

function createBarGraphs(data, id) {
	const width = 1800;
	const height = 400;
	const marginTop = 20;
	const marginRight = 0;
	const marginBottom = 30;
	const marginLeft = 40;

	// Declare the x (horizontal position) scale and the corresponding axis generator.
	const x = d3.scaleBand()
		.domain(data.map(d => d[id + "_title"]))
		.range([marginLeft, width - marginRight])
		.padding(0.1);

	const xAxis = d3.axisBottom(x).tickSizeOuter(0);

	// Declare the y (vertical position) scale.
	const y = d3.scaleLinear()
		.domain([0, d3.max(data, d => d.count)]).nice()
		.range([height - marginBottom, marginTop]);

	// Create the SVG container.
	const svg = d3.create("svg")
		.attr("viewBox", [0, 0, width, height])
		.attr("style", `max-width: ${width}px; height: auto; font: 10px sans-serif; overflow: visible;`);

	// Create a bar for each title.
	const bar = svg.append("g")
		.attr("fill", "steelblue")
		.selectAll("rect")
		.data(data)
		.join("rect")
		.style("mix-blend-mode", "multiply") // Darker color when bars overlap during the transition.
		.attr("x", d => x(d[id +"_title"]))
		.attr("y", d => y(d.count))
		.attr("height", d => y(0) - y(d.count))
		.attr("width", x.bandwidth());

	// Create the axes.
	const gx = svg.append("g")
		.attr("transform", `translate(0,${height - marginBottom})`)
		.call(xAxis);

	const gy = svg.append("g")
		.attr("transform", `translate(${marginLeft},0)`)
		.call(d3.axisLeft(y).tickFormat((y) => (y).toFixed()))
		.call(g => g.select(".domain").remove());

	// Return the chart, with an update function that takes as input a domain
	// comparator and transitions the x axis and bar positions accordingly.
	return Object.assign(svg.node(), {
		update(order) {
			x.domain(data.sort(order).map(d => d[id + "title"]));

			const t = svg.transition()
				.duration(750);

			bar.data(data, d => d[id + "title"])
				.order()
				.transition(t)
				.delay((d, i) => i * 20)
				.attr("x", d => x(d[id + "title"]));

			gx.transition(t)
				.call(xAxis)
				.selectAll(".tick")
				.delay((d, i) => i * 20);
		}
	});
}

function createLineGraph(data, id) {
	// Declare the chart dimensions and margins.
	const width = 928;
	const height = 500;
	const marginTop = 20;
	const marginRight = 30;
	const marginBottom = 30;
	const marginLeft = 40;

	// Extract the range of years from the data for the x-axis scale.
	const yearRange = d3.extent(data, d => d[id + "_year"]);

	// Declare the x (horizontal position) scale.
	const x = d3.scaleLinear()
		.domain([yearRange[0], yearRange[1]]) // Set the domain to the range of years.
		.range([marginLeft, width - marginRight]);

	// Declare the y (vertical position) scale.
	const y = d3.scaleLinear()
		.domain([0, 100]) // Set the domain to start from 0 to 100.
		.range([height - marginBottom, marginTop]);

	// Declare the line generator.
	const line = d3.line()
		.x(d => x(d[id + "_year"]))
		.y(d => y(d.overallAvg));

	// Create the SVG container.
	const svg = d3.create("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("viewBox", [0, 0, width, height])
		.attr("style", "max-width: 100%; height: auto; height: intrinsic;");

	// Add the x-axis.
	svg.append("g")
		.attr("transform", `translate(0,${height - marginBottom})`)
		.call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(10).tickSizeOuter(0)); // Format ticks as years and set number of ticks to 10.

	// Add the y-axis, remove the domain line, add grid lines and a label.
	svg.append("g")
		.attr("transform", `translate(${marginLeft},0)`)
		.call(d3.axisLeft(y).ticks(10))
		.call(g => g.select(".domain").remove())
		.call(g => g.selectAll(".tick line").clone()
			.attr("x2", width - marginLeft - marginRight)
			.attr("stroke-opacity", 0.1))
		.call(g => g.append("text")
			.attr("x", -marginLeft)
			.attr("y", 10)
			.attr("fill", "currentColor")
			.attr("text-anchor", "start")
			.text("↑ Overall Average (%)"));

	// Append a path for the line.
	svg.append("path")
		.attr("fill", "none")
		.attr("stroke", "steelblue")
		.attr("stroke-width", 1.5)
		.attr("d", line(data));

	return svg.node();
}
