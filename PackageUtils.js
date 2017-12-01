'use strict';

var _require = require('url'),
    parseURL = _require.parse;

var URLFormat = /^\/((?:@[^\/@]+\/)?[^\/@]+)(?:@([^\/]+))?(\/.*)?$/;

var decodeParam = function decodeParam(param) {
  return param && decodeURIComponent(param);
};

var ValidQueryKeys = {
  main: true,
  json: true
};

var queryIsValid = function queryIsValid(query) {
  return Object.keys(query).every(function (key) {
    return ValidQueryKeys[key];
  });
};

var parsePackageURL = function parsePackageURL(url) {
  var _parseURL = parseURL(url, true),
      pathname = _parseURL.pathname,
      search = _parseURL.search,
      query = _parseURL.query;

  if (!queryIsValid(query)) return null;

  var match = URLFormat.exec(pathname);

  if (match == null) return null;

  var packageName = match[1];
  var version = decodeParam(match[2]) || 'latest';
  var filename = decodeParam(match[3]);

  return { // If the URL is /@scope/name@version/path.js?main=browser:
    pathname: pathname, // /@scope/name@version/path.js
    search: search, // ?main=browser
    query: query, // { main: 'browser' }
    packageName: packageName, // @scope/name
    version: version, // version
    filename: filename // /path.js
  };
};

var createPackageURL = function createPackageURL(packageName, version, filename, search) {
  var pathname = '/' + packageName;

  if (version != null) pathname += '@' + version;

  if (filename != null) pathname += filename;

  if (search) pathname += search;

  return pathname;
};

module.exports = {
  parsePackageURL: parsePackageURL,
  createPackageURL: createPackageURL
};