'use strict'

// util.js

const fs = require("fs");

var dateFormat = require('dateformat');

exports.stringify = (o, prettify) => {
  if (prettify)
    return JSON.stringify(o, null, '   ')
  return JSON.stringify(o)
}

exports.purify = (o) => {

  var purify = (o) => {
    if (o == null)
      return null

    if (Array.isArray(o)) {
      var ret = []
      o.forEach((element) => {ret.push(purify(element))})
      return ret
    }

    if (typeof o == 'object') {
      if (Object.prototype.toString.call(o) === '[object Date]') {
        return dateFormat(o, "yyyy-mm-dd HH:MM:ss")
      }

      var ret = {}
      for(var key in o) {
        ret[key] = purify(o[key])
      }
      return ret
    }

    if (typeof o == 'string') {
      try {
        return JSON.parse(o)
      } catch(e) {}
      return o
    }

    return o
  }

  return purify(o)
}

exports.conformJson = (s) => {

  var conformJson = (s) => {

    if (s == null) return s

    if (typeof s == 'string') {
      try {
        return JSON.stringify(JSON.parse(s))
      } catch(e) {}
      return s
    }

    return JSON.stringify(s)
  }

  return conformJson(s)
}

exports.conformString = (s) => {

  var conformString = (s) => {

    if (s == null) return s

    if (typeof s == 'string') {
      return s
    }

    return JSON.stringify(s)
  }

  return conformString(s)
}

exports.conformRecords = (records, columns) => {

  try {

    if (records == null) {
      throw Error();
    }

    if (!Array.isArray(records)) {
      records = [records];
    }

    // Extract the columns from the data
    if (!columns) {
      if (records.length == 0) {
        throw Error();
      }
      columns = Object.keys(records[0]).map(key => {return {key: key, name: key}});
    }

    // Confirm that all columns are in proper format
    for (var column of columns) {
      var keys = Object.keys(column);
      if (!keys.includes('key') || !keys.includes('name')) {
        throw Error();
      }
    }

    return records, columns;

  } catch(e) {
    throw Error('Could not parse data', e);
  }
}

exports.files = require("./files");
