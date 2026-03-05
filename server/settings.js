exports.sqldb = {
  host: FIXME,
  user: FIXME,
  password: FIXME,
  database: FIXME,
};

exports.port = FIXME;

/*
CREATE TABLE feeds (
  link VARCHAR(255) PRIMARY KEY,
  local BOOLEAN NOT NULL,
  title TEXT,
  updated DATETIME,
  site VARCHAR(255),
  error TEXT
);

CREATE TABLE entries (
  link VARCHAR(255) PRIMARY KEY,
  title TEXT NOT NULL,
  updated DATETIME NOT NULL,
  created DATETIME NOT NULL,
  ordered DATETIME AS (GREATEST(updated, created)) STORED NOT NULL, INDEX(ordered)
);
*/
