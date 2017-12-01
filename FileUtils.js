'use strict';

var fs = require('fs');
var mime = require('mime');

var TextFiles = /\/?(LICENSE|README|CHANGES|AUTHORS|Makefile|\.[a-z]*rc|\.git[a-z]*|\.[a-z]*ignore)$/i;

var getContentType = function getContentType(file) {
  return TextFiles.test(file) ? 'text/plain' : mime.lookup(file);
};

var getStats = function getStats(file) {
  return new Promise(function (resolve, reject) {
    fs.lstat(file, function (error, stats) {
      if (error) {
        reject(error);
      } else {
        resolve(stats);
      }
    });
  });
};

var getFileType = function getFileType(stats) {
  if (stats.isFile()) return 'file';
  if (stats.isDirectory()) return 'directory';
  if (stats.isBlockDevice()) return 'blockDevice';
  if (stats.isCharacterDevice()) return 'characterDevice';
  if (stats.isSymbolicLink()) return 'symlink';
  if (stats.isSocket()) return 'socket';
  if (stats.isFIFO()) return 'fifo';
  return 'unknown';
};

module.exports = {
  getContentType: getContentType,
  getStats: getStats,
  getFileType: getFileType
};