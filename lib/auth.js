'use strict'

const jwt = require('jsonwebtoken')
const md5 = require("md5");

var config = null;

var buildLogin = (cfg) => {
  cfg = cfg || config;

  var receive = async (req, res, next) => {
    try {
      var context = req.context;

      var params = await ff['extract'](context, req, res);
      var account = await ff['validate'](context, params);
      var session = await ff['establish'](context, account);
      var token = await ff['tokenize'](context, session);
      ff['respond'](context, token, req, res);

    } catch(e) {
      return context.responder.error(req,res,e)
    }
  }

  var extract = async (context, req, res) => {
    return new Promise(async (resolve, reject) => {

      try {

        resolve ({
          user_name: req.body.user_name,
          password: req.body.password
        });

      } catch(e) {
        reject(e);
      }
    });
  }

  var validate = async (context, params) => {
    throw new context.app.NotImplementedError();
  }

  var establish = async (context, account) => {
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

  var tokenize = async (context, data) => {
    return new Promise(async (resolve, reject) => {

      try {
        var contents = Object.assign({}, data);
        contents.timestamp = Date.now();
        if ((cfg.jwt_expiration || 0) == 0) {
          contents.expires = 0;
        } else {
          contents.expires = Date.now() + 1000 * cfg.jwt_expiration;
        }

        resolve(jwt.sign(contents, cfg.jwt_secret));

      } catch(e) {
        reject(e);
      }
    });
  }

  var respond = (context, token, req, res) => {
    req.context.responder.respond(req, res, {token: token});
  }

  var setAction = (action, f) => {
    if (action in ff) {
      ff[action] = f;
    } else {
      throw new Error("Action not supported " + action)
    }
  }

  var ff = {
    receive: receive,
    extract: extract,
    validate: validate,
    establish: establish,
    tokenize: tokenize,
    respond: respond
  }

  return {
    setAction: setAction,
    controller: (req, res, next) => { return ff['receive'](req, res, next); }
  }
}

var buildAuthorization = (cfg) => {

  cfg = cfg || config;

  var receive = async (req, res, next) => {
    try {
      var context = req.context;

      var token = await ff['extract'](context, req, res);
      var session = await ff['parse'](context, token);
      await inject(context, session);
      next();

    } catch(e) {
      return context.responder.error(req,res,e)
    }
  }

  var extract = async (context, req, res) => {
    return new Promise(async (resolve, reject) => {

      try {

        resolve (req.headers.authorization);

      } catch(e) {
        reject(e);
      }
    });
  }

  var parse = (context, token) => {
    return new Promise(async (resolve, reject) => {
      jwt.verify(token, cfg.jwt_secret, async (err, contents) => {
        try {

          if (!err) {
            return resolve(contents);
          }
          throw new (require('../').errors.NotAllowedError)();

        } catch(e) {
          reject(e);
        }
      });
    })
  }

  var inject = (context, session) => {
    return new Promise(async (resolve, reject) => {
      try {
        context.session = session;
        resolve();

      } catch(e) {
        reject(e);
      }
    })
  }

  var setAction = (action, f) => {
    if (action in ff) {
      ff[action] = f;
    } else {
      throw new Error("Action not supported " + action)
    }
  }

  var ff = {
    receive: receive,
    extract: extract,
    parse: parse,
    inject: inject
  }

  return {
    setAction: setAction,
    controller: (req, res, next) => { return ff['receive'](req, res, next); }
  }
}

var hashPassword = (password) => {
  return md5(password + config.password_salt)
}

module.exports = (cfg) => {
  config = cfg;

  return {
    buildLogin: buildLogin,
    buildAuthorization: buildAuthorization,
    hashPassword: hashPassword
  }
}
