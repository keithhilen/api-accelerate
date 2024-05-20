'use strict'

// postgres/index.js

const Promise = require("bluebird");

const errors = require("../../errors");

const createAdapter = (config, logger) => {
  throw new errors.SystemError("Postgres adapter not implemented");
};

module.exports = {
  createAdapter: createAdapter
};
