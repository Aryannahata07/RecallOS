document.getElementById('captureBtn').addEventListener('click', async () => {
  const btn = document.getElementById('captureBtn');
  const status = document.getElementById('status');
  btn.disabled = true;

  const showStatus = (msg, type) => {
    status.className = `status-box ${type}`;
    if (type === 'loading') {
      status.innerHTML = `
        <span class="status-spinner"></span>
        <span class="status-msg">${msg}</span>
      `;
    } else {
      const icon = type === 'success' ? '✓' : '✗';
      status.innerHTML = `
        <span class="status-icon">${icon}</span>
        <span class="status-msg">${msg}</span>
      `;
    }
  };

  showStatus('Scraping page contents...', 'loading');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Execute a script to grab the DOM since the popup can't access it directly
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // Injected function execution context
      const type = document.URL.includes('leetcode.com') ? 'leetcode' : 
                   (document.URL.includes('youtube.com') ? 'youtube' : 'article');
      
      let text = '';
      if (type === 'leetcode') {
        const descNode = document.querySelector('[data-track-load="description_content"]');
        if (descNode) {
          text = descNode.innerText.trim();
        } else {
          const main = document.querySelector('main') || document.body;
          const clone = main.cloneNode(true);
          clone.querySelectorAll('nav, header, footer, button, svg').forEach(el => el.remove());
          text = clone.innerText.trim();
        }
      } else if (type === 'youtube') {
        const titleEl = document.querySelector('h1.ytd-watch-metadata, ytd-watch-metadata h1, #title h1');
        const title = titleEl ? titleEl.innerText.trim() : document.title;
        const channelEl = document.querySelector('#channel-name, ytd-channel-name');
        const channel = channelEl ? channelEl.innerText.trim() : '';
        const descEl = document.querySelector('#description-inline-expander, #description, ytd-text-inline-expander');
        const description = descEl ? descEl.innerText.trim() : '';
        const transcriptSegments = document.querySelectorAll('ytd-transcript-segment-renderer, .ytd-transcript-segment-renderer');
        let transcript = '';
        if (transcriptSegments.length > 0) {
          transcript = Array.from(transcriptSegments)
            .map(s => s.innerText.replace(/\s+/g, ' ').trim())
            .filter(Boolean)
            .join('\n');
        }
        text = `YouTube Video: ${title}\nChannel: ${channel}\n\n`;
        if (description) text += `--- Description ---\n${description}\n\n`;
        if (transcript) text += `--- Video Transcript ---\n${transcript}\n\n`;
      } else {
        const container = document.querySelector('article') || document.querySelector('main') || document.body;
        const clone = container.cloneNode(true);
        const noiseSelectors = [
          'nav', 'aside', 'header', 'footer', '[role="navigation"]',
          '[class*="sidebar"]', '[class*="recommend"]', '[class*="comment"]',
          '#related', '#comments', 'button', 'script', 'style'
        ];
        clone.querySelectorAll(noiseSelectors.join(', ')).forEach(el => el.remove());
        text = clone.innerText.split('\n').map(l => l.trim()).filter(Boolean).join('\n');
      }

      return {
        url: document.URL,
        title: document.title,
        type,
        rawContent: text.substring(0, 40000)
      };
    }
  }, (results) => {
    if (results && results[0] && results[0].result) {
      showStatus('Sending to RecallOS engine...', 'loading');
      const payload = results[0].result;
      
      chrome.runtime.sendMessage({
        action: 'sendToRecallOS',
        payload
      }, (response) => {
        if (response && response.success) {
          showStatus('Captured successfully!', 'success');
          // Close the extension popup window after 2 seconds
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          showStatus(response?.error || 'Failed to send to server.', 'error');
          btn.disabled = false;
        }
      });
    } else {
      showStatus('Failed to read page. Chrome pages are restricted.', 'error');
      btn.disabled = false;
    }
  });
});
