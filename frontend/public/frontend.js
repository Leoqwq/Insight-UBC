document.getElementById("click-me-button").addEventListener("click", handleClickMe);
const addDatasetForm = document.getElementById("add-dataset-form");
const datasetIdInput = document.getElementById("dataset-id-input");
const datasetFileInput = document.getElementById("dataset-file-input");

datasetFileInput.addEventListener("change", function() {
	const selectedFile = datasetFileInput.files[0];
	console.log("Selected file:", selectedFile);
});
addDatasetForm.addEventListener("submit", e => {
	e.preventDefault();
	const id = datasetIdInput.value;
	const file = datasetFileInput.files[0];
	if (!id || !file) {
		alert("Please enter a dataset ID and select a file.");
		return;
	}
	const formData = new FormData();
	formData.append("zipFile", file);

	fetch("/dataset/" + id + "/sections", {
		method: "put",
		body: formData,

	}).then(response => {
		if (!response.ok) {
			throw new Error("Failed to add dataset.");
		}
		return response.json();
	}).then(data => {
		alert("Dataset added successfully!");
	}).catch(error => {
		alert("Error: " + error.message);
	});
});
function handleClickMe() {
	alert("Button Clicked!");
}
