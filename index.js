'use strict';

var http = require('http');
var tmpdir = require('os-tmpdir');

var _require = require('path'),
    joinPaths = _require.join;

var _require2 = require('fs'),
    statFile = _require2.stat,
    readFile = _require2.readFile;

var _require3 = require('semver'),
    maxSatisfyingVersion = _require3.maxSatisfying;

var _require4 = require('./PackageUtils'),
    parsePackageURL = _require4.parsePackageURL,
    createPackageURL = _require4.createPackageURL;

var _require5 = require('./RegistryUtils'),
    getPackageInfo = _require5.getPackageInfo,
    getPackage = _require5.getPackage;

var _require6 = require('./IndexUtils'),
    generateDirectoryIndexHTML = _require6.generateDirectoryIndexHTML;

var _require7 = require('./MetadataUtils'),
    generateMetadata = _require7.generateMetadata;

var _require8 = require('./FileUtils'),
    getFileType = _require8.getFileType;

var _require9 = require('./ResponseUtils'),
    sendNotFoundError = _require9.sendNotFoundError,
    sendInvalidURLError = _require9.sendInvalidURLError,
    sendServerError = _require9.sendServerError,
    sendRedirect = _require9.sendRedirect,
    sendFile = _require9.sendFile,
    sendText = _require9.sendText,
    sendJSON = _require9.sendJSON,
    sendHTML = _require9.sendHTML;

var OneMinute = 60;
var OneDay = OneMinute * 60 * 24;
var OneYear = OneDay * 365;

var checkLocalCache = function checkLocalCache(dir, callback) {
  return statFile(joinPaths(dir, 'package.json'), function (error, stats) {
    callback(stats && stats.isFile());
  });
};

var ResolveExtensions = ['', '.js', '.json'];

var createTempPath = function createTempPath(name) {
  return joinPaths(tmpdir(), 'express-unpkg-' + name);
};

/**
 * Resolves a path like "lib/file" into "lib/file.js" or
 * "lib/file.json" depending on which one is available, similar
 * to how require('lib/file') does.
 */
var resolveFile = function resolveFile(path, useIndex, callback) {
  ResolveExtensions.reduceRight(function (next, ext) {
    var file = path + ext;

    return function () {
      statFile(file, function (error, stats) {
        if (error) {
          if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
            next();
          } else {
            callback(error);
          }
        } else if (useIndex && stats.isDirectory()) {
          resolveFile(joinPaths(file, 'index'), false, function (error, indexFile, indexStats) {
            if (error) {
              callback(error);
            } else if (indexFile) {
              callback(null, indexFile, indexStats);
            } else {
              next();
            }
          });
        } else {
          callback(null, file, stats);
        }
      });
    };
  }, callback)();
};

/**
 * Creates and returns a function that can be used in the "request"
 * event of a standard node HTTP server. Options are:
 *
 * - registryURL    The URL of the npm registry (defaults to https://registry.npmjs.org)
 * - redirectTTL    The TTL (in seconds) for redirects (defaults to 0)
 * - autoIndex      Automatically generate index HTML pages for directories (defaults to true)
 *
 * Supported URL schemes are:
 *
 * /history@1.12.5/umd/History.min.js (recommended)
 * /history@1.12.5 (package.json's main is implied)
 *
 * Additionally, the following URLs are supported but will return a
 * temporary (302) redirect:
 *
 * /history (redirects to version, latest is implied)
 * /history/umd/History.min.js (redirects to version, latest is implied)
 * /history@latest/umd/History.min.js (redirects to version)
 * /history@^1/umd/History.min.js (redirects to max satisfying version)
 */
var createRequestHandler = function createRequestHandler() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var registryURL = options.registryURL || 'https://registry.npmjs.org';
  var redirectTTL = options.redirectTTL || 0;
  var autoIndex = options.autoIndex !== false;
  var maximumDepth = options.maximumDepth || Number.MAX_VALUE;
  var blacklist = options.blacklist || [];

  var handleRequest = function handleRequest(req, res) {
    var url = void 0;
    try {
      url = parsePackageURL(req.url);
      console.log(req.url, url);
    } catch (error) {
      return sendInvalidURLError(res, req.url);
    }

    if (url == null) return sendInvalidURLError(res, req.url);

    var _url = url,
        pathname = _url.pathname,
        search = _url.search,
        query = _url.query,
        packageName = _url.packageName,
        version = _url.version,
        filename = _url.filename;

    var displayName = packageName + '@' + version;

    var isBlacklisted = blacklist.indexOf(packageName) !== -1;

    if (isBlacklisted) return sendText(res, 403, 'Package ' + packageName + ' is blacklisted');

    // Step 1: Fetch the package from the registry and store a local copy.
    // Redirect if the URL does not specify an exact version number.
    var fetchPackage = function fetchPackage(next) {
      var packageDir = createTempPath(displayName);

      checkLocalCache(packageDir, function (isCached) {
        if (isCached) return next(packageDir); // Best case: we already have this package on disk.

        // Fetch package info from NPM registry.
        getPackageInfo(registryURL, packageName, function (error, packageInfo) {
          if (error) return sendServerError(res, error);

          if (packageInfo == null) return sendNotFoundError(res, 'package "' + packageName + '"');

          if (packageInfo.versions == null) return sendServerError(res, new Error('Unable to retrieve info for package ' + packageName));

          var versions = packageInfo.versions,
              tags = packageInfo['dist-tags'];


          if (version in versions) {
            // A valid request for a package we haven't downloaded yet.
            var packageConfig = versions[version];
            var tarballURL = packageConfig.dist.tarball;

            getPackage(tarballURL, packageDir, function (error) {
              if (error) {
                sendServerError(res, error);
              } else {
                next(packageDir);
              }
            });
          } else if (version in tags) {
            sendRedirect(res, createPackageURL(packageName, tags[version], filename, search), redirectTTL);
          } else {
            var maxVersion = maxSatisfyingVersion(Object.keys(versions), version);

            if (maxVersion) {
              sendRedirect(res, createPackageURL(packageName, maxVersion, filename, search), redirectTTL);
            } else {
              sendNotFoundError(res, 'package ' + displayName);
            }
          }
        });
      });
    };

    // Step 2: Determine which file we're going to serve and get its stats.
    // Redirect if the request targets a directory with no trailing slash.
    var findFile = function findFile(packageDir, next) {
      if (filename) {
        var path = joinPaths(packageDir, filename);

        // Based on the URL, figure out which file they want.
        resolveFile(path, false, function (error, file, stats) {
          if (error) {
            sendServerError(res, error);
          } else if (file == null) {
            sendNotFoundError(res, 'file "' + filename + '" in package ' + displayName);
          } else if (stats.isDirectory() && pathname[pathname.length - 1] !== '/') {
            // Append `/` to directory URLs
            sendRedirect(res, pathname + '/' + search, OneYear);
          } else {
            next(file.replace(packageDir, ''), stats);
          }
        });
      } else {
        // No filename in the URL. Try to serve the package's "main" file.
        readFile(joinPaths(packageDir, 'package.json'), 'utf8', function (error, data) {
          if (error) return sendServerError(res, error);

          var packageConfig = void 0;
          try {
            packageConfig = JSON.parse(data);
          } catch (error) {
            return sendText(res, 500, 'Error parsing ' + displayName + '/package.json: ' + error.message);
          }

          var mainFilename = void 0;
          var queryMain = query && query.main;

          if (queryMain) {
            if (!(queryMain in packageConfig)) return sendNotFoundError(res, 'field "' + queryMain + '" in ' + displayName + '/package.json');

            mainFilename = packageConfig[queryMain];
          } else {
            if (typeof packageConfig.unpkg === 'string') {
              // The "unpkg" field allows packages to explicitly declare the
              // file to serve at the bare URL (see #59).
              mainFilename = packageConfig.unpkg;
            } else if (typeof packageConfig.browser === 'string') {
              // Fall back to the "browser" field if declared (only support strings).
              mainFilename = packageConfig.browser;
            } else {
              // If there is no main, use "index" (same as npm).
              mainFilename = packageConfig.main || 'index';
            }
          }

          resolveFile(joinPaths(packageDir, mainFilename), true, function (error, file, stats) {
            if (error) {
              sendServerError(res, error);
            } else if (file == null) {
              sendNotFoundError(res, 'main file "' + mainFilename + '" in package ' + displayName);
            } else {
              next(file.replace(packageDir, ''), stats);
            }
          });
        });
      }
    };

    // Step 3: Send the file, JSON metadata, or HTML directory listing.
    var serveFile = function serveFile(baseDir, path, stats) {
      if (query.json != null) {
        generateMetadata(baseDir, path, stats, maximumDepth, function (error, metadata) {
          if (metadata) {
            sendJSON(res, metadata, OneYear);
          } else {
            sendServerError(res, 'unable to generate JSON metadata for ' + displayName + filename);
          }
        });
      } else if (stats.isFile()) {
        sendFile(res, joinPaths(baseDir, path), stats, OneYear);
      } else if (autoIndex && stats.isDirectory()) {
        getPackageInfo(registryURL, packageName, function (error, packageInfo) {
          if (error) {
            sendServerError(res, 'unable to generate index page for ' + displayName + filename);
          } else {
            generateDirectoryIndexHTML(packageInfo, version, baseDir, path, function (error, html) {
              if (html) {
                sendHTML(res, html, OneYear);
              } else {
                sendServerError(res, 'unable to generate index page for ' + displayName + filename);
              }
            });
          }
        });
      } else {
        sendInvalidURLError(res, '' + displayName + filename + ' is a ' + getFileType(stats));
      }
    };

    fetchPackage(function (packageDir) {
      findFile(packageDir, function (file, stats) {
        serveFile(packageDir, file, stats);
      });
    });
  };

  return handleRequest;
};

/**
 * Creates and returns an HTTP server that serves files from NPM packages.
 */
var createServer = function createServer(options) {
  return http.createServer(createRequestHandler(options));
};

module.exports = {
  createRequestHandler: createRequestHandler,
  createServer: createServer
};