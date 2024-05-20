'use strict'

// logger.js

const Promise = require("bluebird");

const createLogger = (config) => {

  const output = async (type, ...args) => {
    return new Promise(async (resolve, reject) => {

      var aa = [];
      for (var a of args) {
        aa.push(require('./helpers/util').conformJson(a));
      }
      console.log(type + ": ", ...aa);
      resolve();
    })
  }

  const info = async (...args) => {
    return output("info", ...args);
  }

  const system = async (...args) => {
    if (config.system || false) {
      return output("system", ...args);
    }
  }

  const trace = async (...args) => {
    if (config.trace || false) {
      return output("trace", ...args);
    }
  }

  const exception = async (e) => {
    if (typeof e == "object") {
      var kk = Object.getOwnPropertyNames(e);
      var aa = {};
      for (var k of kk) {
        aa[k] = e[k];
       }
      output("error", aa);
    } else {
      return output("error", e);
    }
  }

  const request = async (req, res) => {
    var entry = {
      method: req.method,
      url: req.url
    };

    if (req.body != null) {
      entry.body = req.body;
    }

    entry.headers = req.rawHeaders;

    return output("request", entry);
  }

  const query = async (q, v) => {
    q = q || "";
    return output("query", q.replace(/\s\s+/g, ' '), v);
  }

  const logger = {
    output: output,
    info: info,
    system: system,
    trace: trace,
    exception: exception,
    request: request,
    query: query
  }

  return logger;
}

module.exports = {
  createLogger: createLogger
}
