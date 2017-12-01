'use strict';

var fs = require('fs');
var path = require('path');
var React = require('react');
var ReactDOMServer = require('react-dom/server');
var IndexPage = require('./components/IndexPage');

var _require = require('./FileUtils'),
    getStats = _require.getStats;

var getEntries = function getEntries(dir) {
  return new Promise(function (resolve, reject) {
    fs.readdir(dir, function (error, files) {
      if (error) {
        reject(error);
      } else {
        resolve(Promise.all(files.map(function (file) {
          return getStats(path.join(dir, file));
        })).then(function (statsArray) {
          return statsArray.map(function (stats, index) {
            return { file: files[index], stats: stats };
          });
        }));
      }
    });
  });
};

var DOCTYPE = '<!DOCTYPE html>';

var generateIndexPage = function generateIndexPage(props) {
  return DOCTYPE + ReactDOMServer.renderToStaticMarkup(React.createElement(IndexPage, props));
};

var generateDirectoryIndexHTML = function generateDirectoryIndexHTML(packageInfo, version, baseDir, dir, callback) {
  return getEntries(path.join(baseDir, dir)).then(function (entries) {
    return generateIndexPage({ packageInfo: packageInfo, version: version, dir: dir, entries: entries });
  }).then(function (html) {
    return callback(null, html);
  }, callback);
};

module.exports = {
  generateDirectoryIndexHTML: generateDirectoryIndexHTML
};