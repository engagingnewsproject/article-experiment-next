// Updated question JS that works for this study:
// Includes click/interaction tracking for Prolific integration

Qualtrics.SurveyEngine.addOnload(function()
{
	/*Place your JavaScript here to run when the page loads*/

});

Qualtrics.SurveyEngine.addOnReady(function() {
    // Get the response ID from Qualtrics embedded data
    var responseId = "${e://Field/ResponseID}";
    
    // Select the iframe
    var iframe = document.querySelector('iframe');
    
    // Initialize click/interaction counters in embedded data
    var clickCount = parseInt(Qualtrics.SurveyEngine.getEmbeddedData('ArticleClickCount') || '0');
    var interactionCount = parseInt(Qualtrics.SurveyEngine.getEmbeddedData('ArticleInteractionCount') || '0');
    
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
    
    // Listen for messages from the iframe
    window.addEventListener('message', function(event) {
        // Handle requests for Qualtrics data
        if (event.data && event.data.type === 'REQUEST_QUALTRICS_DATA') {
            console.log('Qualtrics: Received request for data, resending...');
            setTimeout(sendToIframe, 100);
        }
        
        // Handle button clicks (Like/Share buttons)
        if (event.data && event.data.type === 'ARTICLE_BUTTON_CLICK') {
            clickCount++;
            Qualtrics.SurveyEngine.setEmbeddedData('ArticleClickCount', clickCount.toString());
            Qualtrics.SurveyEngine.setEmbeddedData('LastButtonClick', event.data.buttonType);
            Qualtrics.SurveyEngine.setEmbeddedData('LastButtonClickTime', new Date().toISOString());
            
            console.log('Qualtrics: Article button clicked:', event.data.buttonType, 'Total clicks:', clickCount);
            
            // Trigger a synthetic click event on the parent page for Prolific tracking
            // This simulates a click on the parent page, which Prolific can detect
            var syntheticEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            document.body.dispatchEvent(syntheticEvent);
        }
        
        // Handle all other interactions (article link clicks, votes, comments, replies)
        if (event.data && event.data.type === 'ARTICLE_INTERACTION') {
            interactionCount++;
            Qualtrics.SurveyEngine.setEmbeddedData('ArticleInteractionCount', interactionCount.toString());
            Qualtrics.SurveyEngine.setEmbeddedData('LastInteractionType', event.data.interactionType);
            Qualtrics.SurveyEngine.setEmbeddedData('LastInteractionTime', new Date().toISOString());
            
            console.log('Qualtrics: Article interaction:', event.data.interactionType, 'Total interactions:', interactionCount);
            
            // Trigger a synthetic click event on the parent page for Prolific tracking
            var syntheticEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            document.body.dispatchEvent(syntheticEvent);
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