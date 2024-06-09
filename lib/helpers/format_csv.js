'use strict'

// format_csv.js

const Promise = require("bluebird");

const fs = require('fs');
const tmp = require('tmp');
const csv_writer = require('csv-writer');
const files = require('./files');
const util = require('./util');

exports.format = async (records, columns) => {

  return new Promise(async (resolve, reject) => {
    try {

      records, columns = util.conformRecords(records, columns);

      var headers = columns.map(column => {
        return {id:column.key, title:column.name || column.key}
      });

      tmp.tmpName({}, (err, path_name) => {

        if (err) throw err;

        var writer = csv_writer.createObjectCsvWriter({
          path: path_name,
          header: headers
        });

        writer
          .writeRecords(records)
          .then(async ()=> {
            var s = await files.read(path_name);
            fs.unlink(path_name, () => {
              resolve(s);
            });
          })
          .catch((err) => {throw err});

        // resolve (s);
      });

    } catch(e) {
      return reject(e)
    }
  });
}
