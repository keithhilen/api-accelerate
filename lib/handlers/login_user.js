'use strict'

const path = require('path');
const md5 = require('md5');
const jwt = require('jsonwebtoken');

const HANDLER_NAME = path.basename(__filename).split('.')[0];

// One hour JWT expiration by default
const DEFAULT_JWT_EXPIRATION = 60 * 60;

module.exports = (app, params) => {
  // Configure
  var config = app.info.masterConfig();
  params = params || config.auth || {};
  var jwt_expiration = params.jwt_expiration || DEFAULT_JWT_EXPIRATION;
  var jwt_secret = params.jwt_secret;
  var password_salt = params.password_salt;

  // Establish default functions
  var ff = {};

  ff.extract = async (context, req, res) => {
    return new Promise(async (resolve, reject) => {

      try {

        resolve ({
          user_name: (req.body.user_name || "").trim(),
          password: (req.body.password || "").trim()
        });

      } catch(e) {
        reject(e);
      }
    });
  }

  ff.encode = async (context, credentials) => {
    return new Promise(async (resolve, reject) => {

      try {
        if (password_salt) {
          credentials.password = md5(credentials.password + password_salt)
        }
        resolve(credentials);

      } catch(e) {
        reject(e);
      }
    });
  }

  ff.authenticate = async (context, credentials) => {
    throw new (require('../errors').NotImplementedError)();
  }

  ff.establish = async (context, account) => {
    return new Promise(async (resolve, reject) => {
      try {

        // Define the session contents
        var session = {
          account_id: account.account_id,
          user_name: account.user_name
        }

        resolve(session);

      } catch(e) {
        reject(e);
      }
    });
  }

  ff.tokenize = async (context, data) => {
    return new Promise(async (resolve, reject) => {

      try {
        var contents = Object.assign({}, data);
        contents.timestamp = Date.now();
        if ((jwt_expiration || 0) == 0) {
          contents.expires = 0;
        } else {
          contents.expires = Date.now() + 1000 * jwt_expiration;
        }

        resolve(jwt.sign(contents, jwt_secret));

      } catch(e) {
        reject(e);
      }
    });
  }

  ff.respond = (context, token, req, res) => {
    req.context.responder.respond(req, res, {token: token});
  }

  var handler = async (req, res, next) => {
    try {
      var context = req.context;

      var credentials = await ff.extract(context, req, res);
      credentials = await ff.encode(context, credentials);
      var account = await ff.authenticate(context, credentials);
      var session = await ff.establish(context, account);
      var token = await ff.tokenize(context, session);
      ff.respond(context, token, req, res);
      if (next) {
        next();
      }

    } catch(e) {
      context.responder.error(req,res,e)
    }
  };

  // Override setters
  handler.extract = (f) => { ff.extract = f; return handler };
  handler.encode = (f) => { ff.encode = f; return handler };
  handler.authenticate = (f) => { ff.authenticate = f; return handler };
  handler.establish = (f) => { ff.establish = f; return handler };
  handler.tokenize = (f) => { ff.tokenize = f; return handler };
  handler.respond = (f) => { ff.respond = f; return handler };

  return handler;
}
