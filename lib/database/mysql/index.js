'use strict'

// mysql/index.js

const Promise = require("bluebird");

const errors = require("../../errors");

const createAdapter = (config, logger) => {

  var pool = new require('./mysql_pool').createPool(config, logger);

  const start = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        await pool.start();
        resolve();
      } catch(e) {
        reject(e);
      }
    });
  }

  const stop = async () => {
    return new Promise(async (resolve, reject) => {
      await pool.stop();
      resolve();
    });
  }

  const connect = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        var connection = await pool.connect();
        resolve(connection);

      } catch(e) {
        reject(new errors.SystemError("Could not connect to database", e));
      }
    });
  }

  const release = async (connection) => {
    return new Promise(async (resolve, reject) => {
      await pool.release(connection);
      resolve()
    })
  }

  const perform = async (f) => {
    return new Promise(async (resolve, reject) => {
      try {
        var connection = await pool.connect();
        await f(connection);
        resolve();
      } catch(e) {
        reject(e);
      } finally {
        if (connection) {
          pool.release(connection);
        }
      }
    });
  }

  return {
    start: start,
    stop: stop,
    connect: connect,
    release: release,
    perform: perform
  }
};

module.exports = {
  createAdapter: createAdapter
};
