// Detects page type based on URL
function getPageType(url) {
  if (url.includes('leetcode.com')) return 'leetcode';
  if (url.includes('chatgpt.com') || url.includes('claude.ai')) return 'chat';
  if (url.includes('youtube.com')) return 'youtube';
  return 'article';
}

// Custom scraping logic depending on the platform to reduce token waste
function scrapeContent(type) {
  let content = '';
  if (type === 'leetcode') {
    // Attempt to grab just the problem description area if available
    const descNode = document.querySelector('[data-track-load="description_content"]');
    content = descNode ? descNode.innerText : document.body.innerText.substring(0, 5000);
  } else if (type === 'chat') {
    // Grab all chat messages uniquely identifying them by prose classes
    const messages = document.querySelectorAll('.prose, .font-claude-message');
    content = Array.from(messages).map(m => m.innerText).join('\n\n').substring(0, 5000);
  } else {
    // Article fallback: grab the main article tag or fallback to body, limit 5000 chars
    const article = document.querySelector('article') || document.body;
    content = article.innerText.substring(0, 5000); 
  }
  return content;
}

// Inject a floating action button onto the bottom right of the screen
function injectFAB() {
  const btn = document.createElement('button');
  btn.innerText = '🧠 Send to RecallOS';
  btn.style.position = 'fixed';
  btn.style.bottom = '20px';
  btn.style.right = '20px';
  btn.style.zIndex = '999999';
  btn.style.padding = '12px 20px';
  btn.style.backgroundColor = '#000';
  btn.style.color = '#fff';
  btn.style.border = 'none';
  btn.style.borderRadius = '8px';
  btn.style.cursor = 'pointer';
  btn.style.fontFamily = 'sans-serif';
  btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  btn.style.transition = 'all 0.2s';
  
  btn.addEventListener('click', () => {
    btn.innerText = 'Capturing...';
    btn.disabled = true;
    
    const type = getPageType(window.location.href);
    const rawContent = scrapeContent(type);
    
    // Dispatch to background.js
    chrome.runtime.sendMessage({
      action: 'sendToRecallOS',
      payload: {
        url: window.location.href,
        title: document.title,
        type,
        rawContent
      }
    }, (response) => {
      if (response && response.success) {
        btn.innerText = '✅ Captured!';
        btn.style.backgroundColor = '#10B981';
      } else {
        btn.innerText = '❌ Failed';
        btn.style.backgroundColor = '#EF4444';
      }
      setTimeout(() => {
        btn.innerText = '🧠 Send to RecallOS';
        btn.disabled = false;
        btn.style.backgroundColor = '#000';
      }, 3000);
    });
  });

  document.body.appendChild(btn);
}

// Ensure it's not an iframe to prevent multiple buttons
if (window.top === window.self) {
  // Only inject button on specific high-value domains to avoid annoyance
  const url = window.location.href;
  if (url.includes('leetcode.com') || url.includes('chatgpt.com') || url.includes('claude.ai') || url.includes('medium.com')) {
    injectFAB();
  }
}
