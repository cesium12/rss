chrome.storage.local.get('rss', ({rss: {feed, items}}) => {
  const rows = items.map(item => `<tr>
    <td title="${new Date(item.updated)}">${since(item.updated)}</td>
    <td><a href="${item.link}" target="_blank"${item.visited ? ' style="color: red"' : ''} title="${item.title.replace(/"/g, '&quot;')} | ${item.link}">${item.title}</a></td>
  </tr>`);
  rows.unshift(`<tr>
    <th><a href="${feed}" target="_blank">&#x1f517;</a></th>
    <th><button>&nbsp;</button></th>
  </tr>`);
  document.querySelector('table').innerHTML = rows.join('');
  document.querySelector('button').addEventListener('click', () => {
    for (const item of items)
      if (!item.visited)
        chrome.tabs.create({url: item.link, active: false});
    chrome.action.setBadgeText({text: ''});
  });
});

function since(updated) {
  let ms = Date.now() - new Date(updated);
  if ((ms /= 1000) < 60) return `${ms | 0}s`;
  if ((ms /= 60) < 60) return `${ms | 0}m`;
  if ((ms /= 60) < 24) return `${ms | 0}h`;
  return `${(ms /= 24) | 0}d`;
}
