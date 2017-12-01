'use strict';

var fs = require('fs');

var _require = require('path'),
    joinPaths = _require.join;

var _require2 = require('./FileUtils'),
    getContentType = _require2.getContentType,
    getStats = _require2.getStats,
    getFileType = _require2.getFileType;

var getEntries = function getEntries(baseDir, path, maximumDepth) {
  return new Promise(function (resolve, reject) {
    fs.readdir(joinPaths(baseDir, path), function (error, files) {
      if (error) {
        reject(error);
      } else {
        resolve(Promise.all(files.map(function (f) {
          return getStats(joinPaths(baseDir, path, f));
        })).then(function (statsArray) {
          return Promise.all(statsArray.map(function (stats, index) {
            return getMetadata(baseDir, joinPaths(path, files[index]), stats, maximumDepth - 1);
          }));
        }));
      }
    });
  });
};

var formatTime = function formatTime(time) {
  return new Date(time).toISOString();
};

var getMetadata = function getMetadata(baseDir, path, stats, maximumDepth) {
  var metadata = {
    path: path,
    lastModified: formatTime(stats.mtime),
    contentType: getContentType(path),
    size: stats.size,
    type: getFileType(stats)
  };

  if (!stats.isDirectory() || maximumDepth === 0) return Promise.resolve(metadata);

  return getEntries(baseDir, path, maximumDepth).then(function (files) {
    metadata.files = files;
    return metadata;
  });
};

var generateMetadata = function generateMetadata(baseDir, path, stats, maximumDepth, callback) {
  return getMetadata(baseDir, path, stats, maximumDepth).then(function (metadata) {
    return callback(null, metadata);
  }, callback);
};

module.exports = {
  generateMetadata: generateMetadata
};