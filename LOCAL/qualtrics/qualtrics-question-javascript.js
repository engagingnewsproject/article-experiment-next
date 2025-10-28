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
	
	// Function to send Qualtrics data to iframe
	function sendToIframe() {
		if (!responseId) {
			console.error("Qualtrics: No ResponseID found in embedded data.")
			return
		}
		if (!iframe) {
			console.error("Qualtrics: No iframe found to send ResponseID.")
			return
		}
		if (iframe && responseId) {
			const data = { qualtricsResponseId: responseId }
			iframe.contentWindow.postMessage(data, "*")
			console.log("Qualtrics: Sent ResponseID to embedded app:", responseId)
		}
	}
	
	// Listen for requests from the iframe
	window.addEventListener('message', function(event) {
		if (event.data && event.data.type === 'REQUEST_QUALTRICS_DATA') {
			console.log('Qualtrics: Received request for data, resending...')
			setTimeout(sendToIframe, 100)
		}
	})
	
	// Send immediately
	sendToIframe()
	
	// Also retry sending every 500ms for the first 2 seconds to handle timing issues
	var retryCount = 0
	var retryInterval = setInterval(function() {
		if (retryCount < 4) {
			sendToIframe()
			retryCount++
		} else {
			clearInterval(retryInterval)
		}
	}, 500)
})
