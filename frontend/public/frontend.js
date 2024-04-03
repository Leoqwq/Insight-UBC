// document.getElementById("click-me-button").addEventListener("click", handleClickMe);
const addDatasetForm = document.getElementById("add-dataset-form");
const datasetIdInput = document.getElementById("dataset-id-input");
const datasetFileInput = document.getElementById("dataset-file-input");
const removeDatasetButton = document.getElementById("remove-dataset-button");
const datasetIdInputRem = document.getElementById("dataset-id-input-remove");
const viewDatasetsButton = document.getElementById("view-dataset-button");
removeDatasetButton.addEventListener("click", function () {
	const id = datasetIdInputRem.value;

	if (!id) {
		alert("Please enter a dataset ID");
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
// function handleClickMe() {
// 	alert("Button Clicked!");
// }
