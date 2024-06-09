const login_user = require('./login_user');
const authenticate_user = require('./authenticate_user');
const register_user = require('./register_user');
const change_user_password = require('./change_user_password');

const handlers = {
  login_user, 
  authenticate_user, 
  register_user, 
  change_user_password
};

const create = (name, app, params) => {
  try {

    return handlers[name](app, params);

  } catch(e) {

    throw new (require('../errors').SystemError)(`Handler ${name} undefined`);

  }
}

module.exports = { create };
