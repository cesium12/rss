"use strict";

const express = require('express');
const mysql = require('mysql2/promise');
const rssparser = require('rss-parser');
const socketio = require('socket.io');
const settings = require(process.argv[2] || `${process.cwd()}/settings`);
require('console-stamp')(console, {label: false, colors: {stamp: 'yellow'}});

const app = express();
const io = socketio(app.listen(settings.port));
const connection = mysql.createPool(settings.sqldb);
const parser = new rssparser();
parser.parseString = (parse => function(xml, callback) {
  return parse.call(this, xml.replace(/^.+?(<[?]xml )/is, '$1'), callback);
})(parser.parseString);

async function update(link) {
  let data = null, date = null, rows = new Map(), now = new Date();
  try {
    data = await parser.parseURL(link);
  } catch (error) {
    return connection.query('UPDATE feeds SET error = ? WHERE link = ?',
        [String(error), link]);
  }
  if (data.items && data.items.reverse().length) {
    for (const item of data.items) {
      item.link ||= item.guid;
      if (!settings.http.some(site => item.link.includes(site)))
        item.link = item.link.replace('http://', 'https://');
    }
    const [exists] = await connection.query(
        'SELECT * FROM entries WHERE link in (?)',
        [data.items.map(({link}) => link)]);
    for (const {link, title, isoDate} of data.items) {
      const exist = exists.find(exist => exist.link == link);
      if (exist) {
        const before = [exist.link, exist.title, exist.updated, exist.created];
        const after = [link, title ? title : exist.title,
          isoDate ? new Date(isoDate) : exist.updated, exist.created];
        JSON.stringify(before) == JSON.stringify(after) ?
            rows.delete(link) : rows.set(link, after);
      } else rows.set(link, [link, title ? title : link,
        isoDate ? new Date(isoDate) : now, now]);
    }
    if (rows.size) {
      console.log(rows.size, link);
      await connection.query(`
          INSERT INTO entries (link, title, updated, created)
          VALUES ? ON DUPLICATE KEY UPDATE
          title = VALUES(title), updated = VALUES(updated)`,
          [[...rows.values()]]);
    }
    for (const {updated} of exists) if (updated > date) date = updated;
    for (const [, [, , updated]] of rows) if (updated > date) date = updated;
  }
  return connection.query('UPDATE feeds SET ? WHERE link = ?',
      [{title: data.title, updated: date, site: data.link, error: null}, link]);
}

(async () => {
  while (true) try {
    const [links] = await connection.query('SELECT link FROM feeds');
    for (const {link} of links) await update(link);
  } catch (error) {
    console.error(error);
    await new Promise(res => setTimeout(res, 5000));
  }
})();

app.get('/', (req, res) => res.sendFile('feeds.html', {root: __dirname}));
app.get('/:days(\\d+)', (req, res) => connection.query(`
    SELECT link, title, updated FROM entries
    WHERE ordered > DATE_SUB(NOW(), INTERVAL ? DAY)
    ORDER BY ordered desc, updated desc`, [req.params.days])
    .then(([articles]) => res.json({articles})));
io.sockets.on('connection', socket => {
  const init = () => connection.query(
      'SELECT * FROM feeds ORDER BY error desc, title asc')
      .then(([data]) => socket.emit('init', data));
  socket.on('subscribe', async link => {
    console.warn(`(+) ${link}`);
    await connection.query('INSERT IGNORE INTO feeds SET LINK = ?', [link]);
    await update(link);
    init();
  });
  socket.on('unsubscribe', async link => {
    console.warn(`(-) ${link}`);
    await connection.query('DELETE FROM feeds WHERE LINK = ?', [link]);
    init();
  });
  init();
});
