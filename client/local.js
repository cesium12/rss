if (/^(application|text).*(xml|plain)$/.test(document.contentType))
  chrome.runtime.sendMessage(null, {type: 'check'});
chrome.runtime.onMessage.addListener(async link => {
  const text = await (await fetch(location.href)).text();
  chrome.runtime.sendMessage(null, {type: 'upload', link, text});
});
