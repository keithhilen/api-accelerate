'use strict'

// responder.js

const Promise = require("bluebird");

require('./errors')
const util = require('./helpers/util')
const format_csv = require('./helpers/format_csv')
const format_tabular = require('./helpers/format_tabular')

const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const NOT_FOUND = 404;
const SERVER_ERROR = 500;
const NOT_IMPLEMENTED = 501;

const DEFAULT_ACCEPT = "application/json";

const createResponder = (config) => {

  const ok = async (req, res) => {
    return res.end();
  }

  const text = async (req, res, s) => {
    return res.send(s);
  }

  const html = async (req, res, s) => {
    res.setHeader("Content-Type", 'text/html');
    return res.send(s);
  }

  const respond = async (req, res, data, params) => {

    return new Promise(async (resolve, reject) => {
      try {

        const respond = (req, res, data, mime_type) => {
          return new Promise(async (resolve, reject) => {
            try {
              switch(mime_type) {

                case "application/json" :
                  await json(req, res, data, params);
                  return resolve(true);

                case "text/csv" :
                  await csv(req, res, data, params);
                  return resolve(true);

                case "x-text/tabular" :
                case "text/tabular" :
                  await tabular(req, res, data, params);
                  return resolve(true);

                case "text/plain" :
                  await plain_text(req, res, data, params);
                  return resolve(true);

              }

              return resolve(false);

            } catch(e) {

              reject(e);

            }
          });
        }

        var success = false;

        // Iterate over provided Accept header mime types, or try default if none provided
        var accepts = (req.headers["accept"] || "").split(",").map(element => element.trim());
        for (var n = 0; n < accepts.length; n++) {
          if (await respond(req, res, data, accepts[n])) {
            return resolve();
          }
        }
        if (await respond(req, res, data, DEFAULT_ACCEPT)) {
          return resolve();
        }
        await ok(req, res);

      } catch(e) {
        error(req, res, e);
        resolve();
      }
    });
  }

  const json = async (req, res, data, params) => {
    return new Promise(async (resolve, reject) => {
      try {

        var s = util.stringify(util.purify(data), (config.server || {}).prettify_json || false, params);
        res.setHeader("Content-Type", 'application/json');
        res.send(s);
        resolve();

      } catch(e) {

        error(req, res, e);
        resolve();

      }
    });

  }

  const csv = async (req, res, data, params) => {
    return new Promise(async (resolve, reject) => {
      try {
        var s = await format_csv.format(util.purify(data), params);
        res.setHeader("Content-Type", 'text/csv')
        res.send(s);
        resolve();

      } catch(e) {

        error(req, res, e);
        resolve();

      }
    });
  }

  const tabular = async (req, res, data, params) => {
    return new Promise(async (resolve, reject) => {
      try {

        var s = await format_tabular.format(util.purify(data), params);
        await plain_text(req, res, s);
        resolve();

      } catch(e) {

        error(req, res, e);
        resolve();

      }
    });
  }

  const plain_text = async (req, res, s) => {
    return new Promise(async (resolve, reject) => {
      try {
        res.setHeader("Content-Type", 'text/plain')
        res.send(s);
        resolve();

      } catch(e) {

        error(req, res, e);
        resolve();

      }
    });
  }

  const notImplemented = async (req, res, msg) => {
    return res.status(NOT_IMPLEMENTED).send(msg);
  }

  const notAllowed = async (req, res, msg) => {
    res.status(BAD_REQUEST).send(msg);
  }

  const badRequest = async (req, res, msg) => {
    res.status(BAD_REQUEST).send(msg);
  }

  const notFound = async (req, res, msg) => {
    res.status(NOT_FOUND).send(msg);
  }

  const unauthorized = async (req, res, msg) => {
    res.status(UNAUTHORIZED).send(msg);
  }

  const failure = async (req, res, err) => {
    req.app.get("app").logger.exception(err);
    res.status(SERVER_ERROR).end();
  }

  const error = async (req, res, err) => {
    req.app.get("app").logger.exception(err);
    const send = (req, res, http_code, message, id) => {
      if (message == null) {
        return res.status(http_code).end();
      } else {
        return res.status(http_code).send(message);
      }
    }

    if (err == null) {
      return send(req, res, SERVER_ERROR);
    }
    if (err.name == 'NotFoundError') {
      return send(req, res, NOT_FOUND, err.message, err.id);
    }

    if (err.name == 'DuplicateError') {
      return send(req, res, BAD_REQUEST, err.message, err.id);
    }

    if (err.name == 'NotAllowedError') {
      return send(req, res, UNAUTHORIZED, err.message, err.id);
    }

    if (err.name == 'NotImplementedError') {
      return send(req, res, NOT_IMPLEMENTED);
    }

    if (err.name == 'FileError') {
      return send(req, res, BAD_REQUEST, err.message);
    }

    if (err.name == 'ImageError') {
      return send(req, res, BAD_REQUEST, err.message);
    }

    if (err.name == 'HttpError') {
      return send(req, res, BAD_REQUEST);
    }

    if (err.name == 'DatabaseError') {
      return send(req, res, BAD_REQUEST);
    }

    req.app.get("app").logger.exception(err);
    return send(req, res,SERVER_ERROR);
  }

  const responder = {
    ok: ok,
    text: text,
    respond: respond,
    json: json,
    csv: csv,
    tabular: tabular,
    plain_text: plain_text,
    notImplemented: notImplemented,
    notAllowed: notAllowed,
    badRequest: badRequest,
    notFound: notFound,
    unauthorized: unauthorized,
    failure: failure,
    error: error
  }

  return responder;
}

module.exports = {
  createResponder: createResponder
}
