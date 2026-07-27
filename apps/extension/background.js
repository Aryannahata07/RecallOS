// Background service worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendToRecallOS') {
    const { url, title, type, rawContent } = request.payload;
    
    const localUrl = 'http://localhost:3000/api/ingest';
    const prodUrl = 'https://recall-os-web.vercel.app/api/ingest';
    
    const payload = {
      url,
      title,
      type,
      rawContent,
      userId: 'dev-user-id' // Mocked user ID until auth is added
    };

    console.log('[Background] Attempting local ingestion...');
    
    fetch(localUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) throw new Error(`Local HTTP error ${res.status}`);
      return res.json();
    })
    .then(data => {
      console.log('[Background] Local ingestion succeeded');
      sendResponse({ success: true, data });
    })
    .catch(localError => {
      console.warn('[Background] Local ingestion unavailable, attempting production server...', localError.message);
      
      fetch(prodUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (!res.ok) throw new Error(`Production HTTP error ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('[Background] Production ingestion succeeded');
        sendResponse({ success: true, data });
      })
      .catch(prodError => {
        console.error('[Background] Production ingestion failed:', prodError.message);
        sendResponse({ success: false, error: `Ingestion failed: ${prodError.message}` });
      });
    });

    // Return true indicates we wish to send a response asynchronously
    return true; 
  }
});
