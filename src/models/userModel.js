import { db } from "../config/database.js";

export class UserModel {

  static getById(id) {
    return new Promise(resolve => {
      db.get('SELECT * FROM users WHERE id = ?', id, (err, row) => {
        if (err || !row) {
          resolve(null);
        } else {
          resolve(row)
        }
      });
    })
  }

  static getByUsername(username) {
    return new Promise(resolve => {
      db.get('SELECT * FROM users WHERE username = ?', username, (err, row) => {
        if (err || !row) {
          resolve(null);
        } else {
          resolve(row)
        }
      });
    })
  }

  static create(username, password) {
    return new Promise(resolve => {
      db.run('INSERT INTO users VALUES(null, ?, ?)', [username, password], function (err) {
        if (err) {
          resolve(null);
        } else {
          resolve(this.lastID);
        }
      });
    })
  }
}