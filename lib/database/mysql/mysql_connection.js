'use strict'

// mysql_connection.js

const Promise = require("bluebird");

const errors = require("../../errors");

const createConnection = (pool, inner_connection, logger) => {

  const release = async () => {
    pool.release(connection);
  }

  const readOne = async (q, v) => {
    return new Promise(async (resolve, reject) => {

      try {
        var results = await query(q, v);
        if (results.length == 0) {
          throw new errors.NotFoundError("Not found");
        }

        if (results.length > 1) {
          throw new errors.DatabaseError("More than one record");
        }

        resolve(results[0]);

      } catch(e) {
        return reject(e)
      }
    })
  }

  const readList = async (q, v) => {
    return query(q, v);
  }

  const insert = async (q, v) => {
    return new Promise(async (resolve, reject) => {

      try {
        try {

          var results = await inner_connection.queryAsync(q, v)

        } catch(e) {
          if (e.sqlState == "23000" && e.errno == "1062") {
            throw new DuplicateError(q, v, e)
          }

          if (e.sqlState == "23000" && (e.errno == "1451" || e.errno == "1452")) {
            throw new KeyError(q, v, e)
          }

          throw new errors.DatabaseError(q, v, e)

        }

        if (results.rows != null) {
          results = results.rows
        }
        return resolve({
          affected: results.affectedRows,
          changed: results.changedRows,
          key: results.insertId
        })

      } catch(e) {
        return reject(e)
      }

    })
  }

  const update = async (q, v) => {
    return query(q, v);
  }

  const upsert = async (q, v, v2) => {
    return new Promise(async (resolve, reject) => {

      try {
        if (v2 != null) {
          var sets = [];
          for (var k in v2) {
            sets.push(k + "=?")
            v.push(v2[k])
          }
          if (sets.length > 0) {
            q = q + " ON DUPLICATE KEY UPDATE " + sets.join(", ");
          }
          var results = await insert(q, v);
          resolve(results);
        }

      } catch(e) {
        return reject(e)
      }
    })
  }

  const _delete = async (q, v) => {
    return query(q, v);
  }

  const query = async (q, v) => {
    return new Promise(async (resolve, reject) => {

      try {
        try {

          var results = await inner_connection.queryAsync(q, v)

        } catch(e) {
          if (e.sqlState == "23000" && e.errno == "1062") {
            throw new DuplicateError(q, v, e)
          }

          if (e.sqlState == "23000" && (e.errno == "1451" || e.errno == "1452")) {
            throw new KeyError(q, v, e)
          }
          throw new errors.DatabaseError(q, v, e)
        }

        if (results.rows != null) {
          results = results.rows
        }
        return resolve(results)

      } catch(e) {
        return reject(e)
      }

    })
  }

  const escape = async (s) => {
    return new Promise(async (resolve, reject) => {
      try {
        // resolve(mysql.escape (s));
        resolve(s);
      } catch(e) {
        return reject(e)
      }

    })
  }

  const connection = {
    connection: inner_connection,
    release: release,
    readOne: readOne,
    readList: readList,
    insert: insert,
    update: update,
    upsert: upsert,
    insertUpdate: upsert,
    delete: _delete,
    query: query,
    escape: escape
  };

  return connection;
}

module.exports = {
  createConnection: createConnection
}
