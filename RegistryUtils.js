'use strict';

require('isomorphic-fetch');
var debug = require('debug');
var gunzip = require('gunzip-maybe');
var mkdirp = require('mkdirp');
var tar = require('tar-fs');
var RegistryCache = require('./RegistryCache');

var log = debug('express-unpkg');

var getPackageInfoFromRegistry = function getPackageInfoFromRegistry(registryURL, packageName) {
  var encodedPackageName = void 0;
  if (packageName.charAt(0) === '@') {
    encodedPackageName = '@' + encodeURIComponent(packageName.substring(1));
  } else {
    encodedPackageName = encodeURIComponent(packageName);
  }

  var url = registryURL + '/' + encodedPackageName;

  return fetch(url, {
    headers: { 'Accept': 'application/json' }
  }).then(function (response) {
    return response.status === 404 ? null : response.json();
  });
};

var OneMinute = 60 * 1000;
var PackageNotFound = 'PackageNotFound';

var getPackageInfo = function getPackageInfo(registryURL, packageName, callback) {
  var cacheKey = registryURL + packageName;

  RegistryCache.get(cacheKey, function (error, value) {
    if (error) {
      callback(error);
    } else if (value) {
      callback(null, value === PackageNotFound ? null : value);
    } else {
      log('Registry cache miss for package %s', packageName);

      getPackageInfoFromRegistry(registryURL, packageName).then(function (value) {
        if (value == null) {
          // Keep 404s in the cache for 5 minutes. This prevents us
          // from making unnecessary requests to the registry for
          // bad package names. In the worst case, a brand new
          // package's info will be available within 5 minutes.
          RegistryCache.set(cacheKey, PackageNotFound, OneMinute * 5);
        } else {
          RegistryCache.set(cacheKey, value, OneMinute);
        }

        callback(null, value);
      }, function (error) {
        // Do not cache errors.
        RegistryCache.del(cacheKey);
        callback(error);
      });
    }
  });
};

var normalizeTarHeader = function normalizeTarHeader(header) {
  // Most packages have header names that look like "package/index.js"
  // so we shorten that to just "index.js" here. A few packages use a
  // prefix other than "package/". e.g. the firebase package uses the
  // "firebase_npm/" prefix. So we just strip the first dir name.
  header.name = header.name.replace(/^[^\/]+\//, '');
  return header;
};

var getPackage = function getPackage(tarballURL, outputDir, callback) {
  mkdirp(outputDir, function (error) {
    if (error) {
      callback(error);
    } else {
      var callbackWasCalled = false;

      fetch(tarballURL).then(function (response) {
        response.body.pipe(gunzip()).pipe(tar.extract(outputDir, {
          dmode: 438, // All dirs should be writable
          fmode: 292, // All files should be readable
          map: normalizeTarHeader
        })).on('finish', callback).on('error', function (error) {
          if (callbackWasCalled) // LOL node streams
            return;

          callbackWasCalled = true;
          callback(error);
        });
      });
    }
  });
};

module.exports = {
  getPackageInfo: getPackageInfo,
  getPackage: getPackage
};