const feed = FIXME;
const tabs = {};

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('rss', {delayInMinutes: 0, periodInMinutes: 1});
  chrome.action.setBadgeBackgroundColor({color: 'tomato'});
  chrome.action.setPopup({popup: 'popup.html'});
});

chrome.alarms.onAlarm.addListener(async () => {
  let count = 0;
  const {articles, local} = await (await fetch(feed)).json();
  const items = await Promise.all(articles.map(({link, title, updated}) =>
      new Promise(res => chrome.history.getVisits({url: link}, visits => {
        const visited = visits.length > 0;
        if (!visited) ++count;
        res({link, title, updated, visited});
      }))));
  chrome.storage.local.set({rss: {feed, items, local}});
  chrome.action.setBadgeText({text: count ? String(count) : ''});
  chrome.action.setTitle({title: new Date().toLocaleTimeString()});
});

chrome.runtime.onMessage.addListener(async (message, {tab: {id} = {}}) => {
  switch (message.type) {
    case 'register':
      tabs[message.id] = message.link;
      break;
    case 'check':
      if (tabs[id]) chrome.tabs.sendMessage(id, tabs[id]);
      break;
    case 'upload':
      await fetch(feed, {
        method: 'POST',
        body: JSON.stringify(message),
        headers: {'Content-Type': 'application/json'},
      });
      await chrome.tabs.remove(id);
      delete tabs[id];
      break;
  }
});
