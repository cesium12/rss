chrome.storage.local.get('rss', ({rss: {feed, items, local}}) => {
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
    for (const {link, visited} of items)
      if (!visited) chrome.tabs.create({url: link, active: false});
    for (const {link} of local)
      chrome.tabs.create({url: link, active: false}).then(({id}) =>
          chrome.runtime.sendMessage(null, {type: 'register', id, link}));
    chrome.action.setBadgeText({text: ''});
  });
});

function since(updated) {
  let ms = Date.now() - new Date(updated);
  const prefix = (() => {
    if (ms >= 0) return '';
    ms *= -1;
    return '-';
  })();
  const suffix = (() => {
    if ((ms /= 1000) < 60) return 's';
    if ((ms /= 60) < 60) return 'm';
    if ((ms /= 60) < 24) return 'h';
    ms /= 24;
    return 'd';
  })();
  return `${prefix}${ms | 0}${suffix}`;
}
