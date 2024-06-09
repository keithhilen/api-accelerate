'use strict'

const path = require('path');
const jwt = require('jsonwebtoken')

const HANDLER_NAME = path.basename(__filename).split('.')[0];

module.exports = (app, params) => {

  // Configure
  var config = app.info.masterConfig();
  params = params || config.auth || {};
  var jwt_secret = params.jwt_secret || null;

  // Establish default functions
  var ff = {};

  ff.extract = async (context, req, res) => {
    return new Promise(async (resolve, reject) => {

      try {

        resolve (req.headers.authorization);

      } catch(e) {
        reject(e);
      }
    });
  }

  ff.parse = (context, token) => {
    return new Promise(async (resolve, reject) => {
      jwt.verify(token, jwt_secret, async (err, contents) => {
        try {

          if (err) {
            throw new (require('../errors').NotAllowedError)();
          }

          resolve(contents);

        } catch(e) {
          reject(e);
        }
      });
    })
  }

  ff.inject = (context, session) => {
    return new Promise(async (resolve, reject) => {
      try {
        context.session = session;
        resolve();

      } catch(e) {
        reject(e);
      }
    })
  }

  const handler = async (req, res, next) => {
    try {
      var context = req.context;

      var token = await ff.extract(context, req, res);
      var session = await ff.parse(context, token);
      await ff.inject(context, session);
      if (next) {
        next();
      }

    } catch(e) {
      context.responder.error(req,res,e)
    }
  }

  // Override setters
  handler.extract = (f) => { ff.extract = f; return handler };
  handler.parse = (f) => { ff.parse = f; return handler };
  handler.inject = (f) => { ff.inject = f; return handler };

  return handler;
}
