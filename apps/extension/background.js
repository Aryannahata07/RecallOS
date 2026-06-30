// Background service worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendToRecallOS') {
    const { url, title, type, rawContent } = request.payload;
    
    // Forward the scraped data to our Next.js backend ingestion API
    fetch('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        title,
        type,
        rawContent,
        userId: 'dev-user-id' // Mocked user ID until auth is added
      })
    })
    .then(res => res.json())
    .then(data => sendResponse({ success: true, data }))
    .catch(error => sendResponse({ success: false, error: error.message }));

    // Return true indicates we wish to send a response asynchronously
    return true; 
  }
});
