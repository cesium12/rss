const feed = FIXME;

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('rss', {delayInMinutes: 0, periodInMinutes: 1});
  chrome.action.setBadgeBackgroundColor({color: 'tomato'});
  chrome.action.setPopup({popup: 'popup.html'});
});

chrome.alarms.onAlarm.addListener(async () => {
  let count = 0;
  const {articles} = await (await fetch(feed)).json();
  const items = await Promise.all(articles.map(({link, title, updated}) =>
      new Promise(res => chrome.history.getVisits({url: link}, visits => {
        const visited = visits.length > 0;
        if (!visited) ++count;
        res({link, title, updated, visited});
      }))));
  chrome.storage.local.set({rss: {feed, items}});
  chrome.action.setBadgeText({text: count ? String(count) : ''});
  chrome.action.setTitle({title: new Date().toLocaleTimeString()});
});
