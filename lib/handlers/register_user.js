'use strict'

const path = require('path');
const md5 = require('md5');

const HANDLER_NAME = path.basename(__filename).split('.')[0];

module.exports = (app, params) => {

  // Configure
  var config = app.info.masterConfig();
  params = params || config.auth || {};
  var password_salt = params.password_salt;
  var regex_user_name = params.regex_user_name;
  var regex_password = params.regex_password;

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

  ff.validate = async (context, credentials) => {
    return new Promise(async (resolve, reject) => {

      try {

        if (regex_user_name) {
          if (!regex_user_name.test(credentials.user_name)) {
            throw Error('Invalid email address')
          }
        }

        if (regex_password) {
          if (!regex_password.test(credentials.password)) {
            throw Error('Invalid password')
          }
        }

        resolve();

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

  ff.register = async (context, credentials) => {
    return new Promise(async (resolve, reject) => {
      try {

        throw new (require('../errors').NotImplementedError)();

      } catch(e) {
        reject(e);
      }
    });
  }

  ff.respond = (context, info, req, res) => {
    req.context.responder.respond(req, res, info);
  }

  const handler = async (req, res, next) => {
    try {
      var context = req.context;

      var credentials = await ff.extract(context, req, res);
      await ff.validate(context, credentials);
      credentials = await ff.encode(context, credentials);
      var account = await ff.register(context, credentials);
      ff.respond(context, account, req, res);
      if (next) {
        next();
      }

    } catch(e) {
      context.responder.error(req,res,e)
    }
  }

  // Override setters
  handler.extract = (f) => { ff.extract = f; return handler };
  handler.validate = (f) => { ff.validate = f; return handler };
  handler.encode = (f) => { ff.encode = f; return handler };
  handler.register = (f) => { ff.register = f; return handler };
  handler.respond = (f) => { ff.respond = f; return handler };

  return handler;
}
