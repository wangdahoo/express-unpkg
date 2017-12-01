'use strict';

var redis = require('redis');
var createLRUCache = require('lru-cache');

var createRedisCache = function createRedisCache(redisURL) {
  var client = redis.createClient(redisURL);

  var createKey = function createKey(key) {
    return 'registry:' + key;
  };

  var set = function set(key, value, expiry) {
    client.set(createKey(key), JSON.stringify(value));
    client.pexpire(createKey(key), expiry);
  };

  var get = function get(key, callback) {
    client.get(createKey(key), function (error, value) {
      callback(error, value && JSON.parse(value));
    });
  };

  var del = function del(key) {
    client.del(createKey(key));
  };

  return { set: set, get: get, del: del };
};

var createMemoryCache = function createMemoryCache(options) {
  var cache = createLRUCache(options);

  var set = function set(key, value, expiry) {
    cache.set(key, value, expiry);
  };

  var get = function get(key, callback) {
    callback(null, cache.get(key));
  };

  var del = function del(key) {
    cache.del(key);
  };

  return { set: set, get: get, del: del };
};

var RegistryCache = process.env.REDIS_URL ? createRedisCache(process.env.REDIS_URL) : createMemoryCache({ max: 1000 });

module.exports = RegistryCache;