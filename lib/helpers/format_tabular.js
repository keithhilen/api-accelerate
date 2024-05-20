'use strict'

const Promise = require("bluebird");
const util = require('./util');

exports.format = async (records, columns) => {

  return new Promise(async (resolve, reject) => {
    try {

      records, columns = util.conformRecords(records, columns);

      var widths = {};
      for (var column of columns) {
        var key = column.key;
        widths[key] = column.name.length;
      }
      for (var record of records) {
        for (var column of columns) {
          var key = column.key;
          var value = String(record[key] || "");
          widths[key] = Math.max(widths[key], value.length)
        }
      }

      var s = "";

      // Top bar
      for (var column of columns) {
        var key = column.key;
        s += "+" + "-".repeat(widths[key] + 2)
      }
      s += "+\n";

      // Headers
      for (var column of columns) {
        var key = column.key;
        var name = column.name;
        s += "| " + name + " ".repeat(widths[key] - (name || key).length) + " "
      }
      s += "|\n";

      // Separator bar
      for (var column of columns) {
        var key = column.key;
        s += "+" + "-".repeat(widths[key] + 2)
      }
      s += "+\n";

      // Data
      for (var record of records) {
        for (var column of columns) {
          key = column.key;

          var value = String(record[key] || "");
          var spaces = widths[key] - value.length;
          spaces = spaces < 0 ? 0 : spaces;
          s += "| " + value + " ".repeat(spaces) + " "
        }
        s += "|\n";
      }

      // Bottom bar
      for (var column of columns) {
        var key = column.key;
        s += "+" + "-".repeat(widths[key] + 2)
      }
      s += "+\n";

      resolve(s);

    } catch(e) {
      return reject(e)
    }
  });
}
