document.getElementById('captureBtn').addEventListener('click', async () => {
  const btn = document.getElementById('captureBtn');
  const status = document.getElementById('status');
  btn.disabled = true;
  status.textContent = 'Injecting script to scrape page...';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Execute a script to grab the DOM since the popup can't access it directly
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // Injected function execution context
      const type = document.URL.includes('leetcode.com') ? 'leetcode' : 'article';
      return {
        url: document.URL,
        title: document.title,
        type,
        rawContent: document.body.innerText.substring(0, 5000)
      };
    }
  }, (results) => {
    if (results && results[0] && results[0].result) {
      status.textContent = 'Sending to RecallOS...';
      const payload = results[0].result;
      
      chrome.runtime.sendMessage({
        action: 'sendToRecallOS',
        payload
      }, (response) => {
        if (response && response.success) {
          status.textContent = '✅ Captured successfully!';
        } else {
          status.textContent = '❌ Failed: ' + (response?.error || 'Unknown error. Is Next.js server running?');
        }
        btn.disabled = false;
      });
    } else {
      status.textContent = '❌ Failed to read page. Ensure you are not on a restricted chrome:// page.';
      btn.disabled = false;
    }
  });
});
