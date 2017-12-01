'use strict';

var fs = require('fs');
var etag = require('etag');

var _require = require('./FileUtils'),
    getContentType = _require.getContentType;

var sendText = function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain',
    'Content-Length': text.length
  });

  res.end(text);
};

var sendJSON = function sendJSON(res, json) {
  var maxAge = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var statusCode = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 200;

  var text = JSON.stringify(json);

  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': text.length,
    'Cache-Control': 'public, max-age=' + maxAge
  });

  res.end(text);
};

var sendInvalidURLError = function sendInvalidURLError(res, url) {
  return sendText(res, 403, 'Invalid URL: ' + url);
};

var sendNotFoundError = function sendNotFoundError(res, what) {
  return sendText(res, 404, 'Not found: ' + what);
};

var sendServerError = function sendServerError(res, error) {
  return sendText(res, 500, 'Server error: ' + (error.message || error));
};

var sendHTML = function sendHTML(res, html) {
  var maxAge = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var statusCode = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 200;

  res.writeHead(statusCode, {
    'Content-Type': 'text/html',
    'Content-Length': html.length,
    'Cache-Control': 'public, max-age=' + maxAge
  });

  res.end(html);
};

var sendRedirect = function sendRedirect(res, relativeLocation) {
  var maxAge = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var statusCode = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 302;

  var location = res.req && res.req.baseUrl ? res.req.baseUrl + relativeLocation : relativeLocation;

  var html = '<p>You are being redirected to <a href="' + location + '">' + location + '</a>';

  res.writeHead(statusCode, {
    'Content-Type': 'text/html',
    'Content-Length': html.length,
    'Cache-Control': 'public, max-age=' + maxAge,
    'Location': location
  });

  res.end(html);
};

var sendFile = function sendFile(res, file, stats) {
  var maxAge = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

  var contentType = getContentType(file);

  if (contentType === 'text/html') contentType = 'text/plain'; // We can't serve HTML because bad people :(

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stats.size,
    'Cache-Control': 'public, max-age=' + maxAge,
    'ETag': etag(stats)
  });

  var stream = fs.createReadStream(file);

  stream.on('error', function (error) {
    sendServerError(res, error);
  });

  stream.pipe(res);
};

module.exports = {
  sendText: sendText,
  sendJSON: sendJSON,
  sendInvalidURLError: sendInvalidURLError,
  sendNotFoundError: sendNotFoundError,
  sendServerError: sendServerError,
  sendHTML: sendHTML,
  sendRedirect: sendRedirect,
  sendFile: sendFile
};