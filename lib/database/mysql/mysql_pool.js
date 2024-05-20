'use strict'

// mysql_pool.js

const Promise = require("bluebird");

const mysql = require('mysql')
Promise.promisifyAll(mysql)
Promise.promisifyAll(require("mysql/lib/Connection").prototype)
Promise.promisifyAll(require("mysql/lib/Pool").prototype)

const errors = require("../../errors");

const mysql_connection = require("./mysql_connection");

const createPool = (config, logger) => {
  var mysqlPool = null;
  var connection_count = 0;

  const start = async () => {

    return new Promise(async (resolve, reject) => {
      try {

        if (mysqlPool != null) {
          return resolve();
        }

        connection_count = 0;
        var cfg = {
          host:              config.host,
          user:              config.user,
          password:          config.password,
          database:          config.database,
          port:              config.port,
          connection_limit : config.connections,
          flags:            '-FOUND_ROWS'   // Ensure affectedRows includes changed rows on update, not matched rows
        };

        mysqlPool = mysql.createPool(cfg);
        if (config.logging.queries || config.logging.connections) {

          mysqlPool.on('acquire', function (connection) {
            if (config.logging.connections) {
              ++connection_count;
              logger.trace('acquire connection ' + connection_count);
            }
          });

          mysqlPool.on('connection', function (connection) {
            if (config.logging.connections) {
              logger.trace('connection');
            }

            if (config.logging.queries) {
              connection.on('enqueue', function(sequence) {
                if (sequence.sql != null) {
                  logger.query(sequence.sql);
                }
              });
            }
          });

          mysqlPool.on('enqueue', function (connection) {
            if (config.logging.connections) {
              logger.trace('enqueue connection');
            }
          });

          mysqlPool.on('release', function (connection) {
            if (config.logging.connections) {
              --connection_count;
              logger.trace('release connection ' + connection_count);
            }
          });
        }
        resolve();
      } catch(e) {
        reject(e);
      }
    });
  }

  const stop = async () => {

    return new Promise(async (resolve, reject) => {
      try {

        if (mysqlPool == null) {
          return resolve();
        }

        await mysqlPool.end();
        mysqlPool = null;
        resolve();

      } catch(e) {
        reject(e);
      }
    });
  }


  const connect = async () => {
    return new Promise(async (resolve, reject) => {
      try{
        var connection = await mysqlPool.getConnectionAsync();
        // resolve(new MysqlConnection(pool, connection, logger));
        resolve(mysql_connection.createConnection(pool, connection, logger));

      } catch(e) {
        reject(new errors.SystemError("Could not connect to database", e))
      }
    })
  }

  const release = async (connection) => {
    return new Promise(async (resolve, reject) => {
      connection.connection.release();
      // await mysqlPool.release(connection);
      resolve();
    })
  }

  const pool = {
    start: start,
    stop: stop,
    connect: connect,
    release: release
  }

  return pool;
}

module.exports = {
  createPool: createPool
}
