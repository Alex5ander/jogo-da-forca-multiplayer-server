import sqlite3 from 'sqlite3';
export const db = new sqlite3.Database("database.sqlite");
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY NOT NULL, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL) ");
})