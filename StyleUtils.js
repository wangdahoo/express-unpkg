'use strict';

var fs = require('fs');
var path = require('path');
var csso = require('csso');

var minifyCSS = function minifyCSS(css) {
  return csso.minify(css).css;
};

var readCSS = function readCSS() {
  return minifyCSS(fs.readFileSync(path.resolve.apply(path, arguments), 'utf8'));
};

module.exports = {
  minifyCSS: minifyCSS,
  readCSS: readCSS
};