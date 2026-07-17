// Detects page type based on URL
function getPageType(url) {
  if (url.includes('leetcode.com')) return 'leetcode';
  if (url.includes('chatgpt.com') || url.includes('claude.ai') || url.includes('gemini.google.com')) return 'chat';
  if (url.includes('youtube.com')) return 'youtube';
  return 'article';
}

// Scrape Claude.ai, ChatGPT & Gemini conversations while completely excluding sidebars, menus, and UI noise
function scrapeChatContent() {
  const mainEl = document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
  const clone = mainEl.cloneNode(true);

  // Remove sidebars, navigation drawers, headers, footers, and UI buttons
  const unwantedSelectors = [
    'nav',
    'aside',
    'header',
    'footer',
    '[role="navigation"]',
    '[class*="sidebar"]',
    '[class*="Sidebar"]',
    '[class*="drawer"]',
    '[class*="history"]',
    '[class*="navigation"]',
    '[class*="Menu"]',
    '[data-testid*="sidebar"]',
    'button',
    'form',
    'svg',
    '[aria-hidden="true"]'
  ];

  clone.querySelectorAll(unwantedSelectors.join(', ')).forEach(el => el.remove());

  // Target message content nodes if available (Claude, ChatGPT, Gemini)
  const messageNodes = clone.querySelectorAll('.prose, [class*="font-claude"], [class*="message"], [data-message-author-role], [data-test-render-count], user-query, message-content, model-response, .conversation-container');
  let text = '';

  if (messageNodes.length > 0) {
    const textPieces = [];
    messageNodes.forEach(node => {
      const t = node.innerText.trim();
      if (t && !textPieces.includes(t)) {
        textPieces.push(t);
      }
    });
    text = textPieces.join('\n\n');
  }

  if (!text || text.trim().length < 50) {
    text = clone.innerText.trim();
  }

  // Clean extra blank lines
  return text.split('\n').map(l => l.trim()).filter(Boolean).join('\n').substring(0, 35000);
}

// Scrape YouTube video details & transcript without recommended sidebar videos or comments
function scrapeYouTubeContent() {
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

  let text = `YouTube Video: ${title}\nChannel: ${channel}\n\n`;
  if (description) {
    text += `--- Description ---\n${description}\n\n`;
  }
  if (transcript) {
    text += `--- Video Transcript ---\n${transcript}\n\n`;
  }

  return text.substring(0, 35000);
}

// Scrape LeetCode problem description & code
function scrapeLeetCodeContent() {
  const descNode = document.querySelector('[data-track-load="description_content"]');
  if (descNode) return descNode.innerText.trim().substring(0, 35000);

  const main = document.querySelector('main') || document.body;
  const clone = main.cloneNode(true);
  clone.querySelectorAll('nav, header, footer, button, svg').forEach(el => el.remove());
  return clone.innerText.trim().substring(0, 35000);
}

// Scrape General Web Articles & Pages
function scrapeArticleContent() {
  const container = document.querySelector('article') || document.querySelector('main') || document.body;
  const clone = container.cloneNode(true);

  const noiseSelectors = [
    'nav', 'aside', 'header', 'footer', '[role="navigation"]',
    '[class*="sidebar"]', '[class*="recommend"]', '[class*="comment"]',
    '#related', '#comments', 'button', 'script', 'style'
  ];
  clone.querySelectorAll(noiseSelectors.join(', ')).forEach(el => el.remove());

  return clone.innerText.split('\n').map(l => l.trim()).filter(Boolean).join('\n').substring(0, 35000);
}

// Custom scraping logic depending on the platform
function scrapeContent(type) {
  let content = '';

  if (type === 'leetcode') {
    content = scrapeLeetCodeContent();
  } else if (type === 'chat') {
    content = scrapeChatContent();
  } else if (type === 'youtube') {
    content = scrapeYouTubeContent();
  } else {
    content = scrapeArticleContent();
  }

  // Fallback to page title and URL if content is still empty
  if (!content || !content.trim()) {
    content = `Page Title: ${document.title}\nURL: ${window.location.href}`;
  }

  return content.trim();
}

// Inject a floating action button onto the bottom right of the screen
function injectFAB() {
  const btn = document.createElement('button');
  btn.id = 'recallos-fab';

  const logoUrl = chrome.runtime.getURL('popup/logo.png');

  const setContent = (text, isSubmitting = false) => {
    btn.innerHTML = `
      <img src="${logoUrl}" alt="RecallOS" style="height:22px;width:auto;display:block;object-fit:contain;border-radius:4px;" />
      <span style="font-weight:700;font-size:13px;letter-spacing:-0.01em;line-height:1;color:#f4f1ea;">${text}</span>
    `;
    btn.disabled = isSubmitting;
  };

  btn.style.position = 'fixed';
  btn.style.bottom = '24px';
  btn.style.right = '24px';
  btn.style.zIndex = '9999999';
  btn.style.display = 'inline-flex';
  btn.style.alignItems = 'center';
  btn.style.gap = '8px';
  btn.style.padding = '10px 16px';
  btn.style.backgroundColor = '#000000';
  btn.style.color = '#f4f1ea';
  btn.style.border = '1px solid #333333';
  btn.style.borderRadius = '10px';
  btn.style.cursor = 'pointer';
  btn.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  btn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
  btn.style.transition = 'transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease';

  btn.addEventListener('mouseenter', () => {
    if (!btn.disabled) {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 10px 28px rgba(0,0,0,0.4)';
    }
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translateY(0)';
    btn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
  });

  setContent('Send to RecallOS');

  btn.addEventListener('click', () => {
    // Check if Chrome extension context is valid
    if (!chrome.runtime || !chrome.runtime.id) {
      setContent('Please refresh page');
      setTimeout(() => setContent('Send to RecallOS'), 3000);
      return;
    }

    setContent('Capturing...', true);

    const type = getPageType(window.location.href);
    const rawContent = scrapeContent(type);

    try {
      chrome.runtime.sendMessage({
        action: 'sendToRecallOS',
        payload: {
          url: window.location.href,
          title: document.title,
          type,
          rawContent
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('[RecallOS Extension] Runtime error:', chrome.runtime.lastError.message);
          setContent('Refresh page to reconnect');
        } else if (response && response.success) {
          setContent('Captured to RecallOS!');
        } else {
          setContent(response?.error || 'Capture Failed');
        }
        setTimeout(() => {
          setContent('Send to RecallOS');
        }, 3000);
      });
    } catch (err) {
      console.warn('[RecallOS Extension] Context invalidated error:', err);
      setContent('Refresh page to reconnect');
      setTimeout(() => setContent('Send to RecallOS'), 3000);
    }
  });

  document.body.appendChild(btn);
}

// Ensure it's not an iframe to prevent multiple buttons
if (window.top === window.self) {
  const url = window.location.href;
  if (url.includes('leetcode.com') || url.includes('chatgpt.com') || url.includes('claude.ai') || url.includes('gemini.google.com') || url.includes('medium.com')) {
    injectFAB();
  }
}
