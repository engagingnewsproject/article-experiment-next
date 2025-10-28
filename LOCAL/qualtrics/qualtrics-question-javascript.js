Qualtrics.SurveyEngine.addOnload(function () {
	var blockStartTime = Date.now() // start timing immediately

	// fallback if full page load is needed
	window.addEventListener("load", function () {
		blockStartTime = Date.now()
	})

	jQuery(".NextButton").on("click", function () {
		var durationSeconds = ((Date.now() - blockStartTime) / 1000).toFixed(2)

		// Current block name set in Survey Flow before block
		var blockName = Qualtrics.SurveyEngine.getEmbeddedData("CurrentBlockName")
		var fieldName = blockName + "Duration"

		Qualtrics.SurveyEngine.setEmbeddedData(fieldName, durationSeconds)
		Qualtrics.SurveyEngine.setEmbeddedData("BlockName", blockName)

		console.log(fieldName + " recorded:", durationSeconds)
	})
})
Qualtrics.SurveyEngine.addOnReady(function () {
	var responseId = "${e://Field/ResponseID}"
	var iframe = document.querySelector("iframe") // Adjust selector if needed
	if (!responseId) {
		console.error("Qualtrics: No ResponseID found in embedded data.")
	}
	if (!iframe) {
		console.error("Qualtrics: No iframe found to send ResponseID.")
	}
	if (iframe && responseId) {
		iframe.contentWindow.postMessage({ qualtricsResponseId: responseId }, "*")
		console.log("Qualtrics: Sent ResponseID to embedded app:", responseId)
	}
})
