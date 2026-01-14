// Updated question JS that SHOULD work:
Qualtrics.SurveyEngine.addOnload(function()
{
	/*Place your JavaScript here to run when the page loads*/

});

Qualtrics.SurveyEngine.addOnReady(function() {
    // Get the response ID from Qualtrics embedded data
    var responseId = "${e://Field/ResponseID}";
    
    // Select the iframe
    var iframe = document.querySelector('iframe');
    
    // Function to send Qualtrics data to iframe
    function sendToIframe() {
        if (!responseId) {
            console.error('Qualtrics: ResponseID not found');
            return;
        }
        if (!iframe) {
            console.error('Qualtrics: No iframe found');
            return;
        }
        if (iframe && responseId) {
            iframe.contentWindow.postMessage({
                qualtricsResponseId: responseId
            }, '*');
            console.log('Qualtrics: Sent ResponseID to embedded app:', responseId);
        }
    }
    
    // Listen for requests from the iframe
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'REQUEST_QUALTRICS_DATA') {
            console.log('Qualtrics: Received request for data, resending...');
            setTimeout(sendToIframe, 100);
        }
    });
    
    // Send immediately
    sendToIframe();
    
    // Also retry sending every 500ms for the first 2 seconds to handle timing issues
    var retryCount = 0;
    var retryInterval = setInterval(function() {
        if (retryCount < 4) {
            sendToIframe();
            retryCount++;
        } else {
            clearInterval(retryInterval);
        }
    }, 500);
});

Qualtrics.SurveyEngine.addOnUnload(function()
{
	/*Place your JavaScript here to run when the page is unloaded*/

});