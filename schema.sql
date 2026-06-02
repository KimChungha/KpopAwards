-- Run this once to set up the database
-- npx wrangler d1 execute music-awards-db --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS years (
  year INTEGER PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nominations (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (year) REFERENCES years(year)
);

CREATE TABLE IF NOT EXISTS winners (
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  nomination_id TEXT NOT NULL,
  PRIMARY KEY (year, category),
  FOREIGN KEY (year) REFERENCES years(year),
  FOREIGN KEY (nomination_id) REFERENCES nominations(id)
);
