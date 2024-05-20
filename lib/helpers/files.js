'use strict'

// files.js

const Promise = require("bluebird");

var fs = require('fs')

exports.read = (path) => {
  return new Promise(async (resolve, reject) => {

    fs.readFile(path, "utf8", (err, content) => {
      if (err) {
        return reject(err);
      }
      resolve(content);
    })
  })
}

exports.copy = (source, target) => {
  return new Promise(async (resolve, reject) => {

    fs.link(source, target, function (err, data) {
      if (err) {
        return reject(err);
      }
      return resolve();
    })
  })
}

exports.remove = (source) => {
  return new Promise(async (resolve, reject) => {

    fs.unlink(source, function (err, data) {
      if (err) {
        return reject(err);
      }
      return resolve();
    })
  })
}

exports.ls = (source) => {
  return new Promise(async (resolve, reject) => {

    fs.readdir(path, function(err, items) {
      if (err) {
        return reject(err);
      }
      resolve(items);
      return resolve()
    })
  })
}

 