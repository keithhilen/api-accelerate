'use strict'

// index.js

const errors = require('../errors');

module.exports = {
  createAdapter: (config, logger) => {

    switch (config.adapter) {

      case "mysql":
        return require('./mysql').createAdapter(config, logger);
        break;

      case "postgres":
        return require('./postgres').createAdapter(config, logger);
        break;

      default:
        return null;
    }
  }
}
