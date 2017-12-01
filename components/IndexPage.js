'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var semver = require('semver');
var React = require('react');
var PropTypes = require('prop-types');
var DirectoryListing = require('./DirectoryListing');

var _require = require('../StyleUtils'),
    readCSS = _require.readCSS;

var IndexPageStyle = readCSS(__dirname, 'IndexPage.css');
var IndexPageScript = '\nvar s = document.getElementById(\'version\'), v = s.value\ns.onchange = function () {\n  window.location.href = window.location.href.replace(\'@\' + v, \'@\' + s.value)\n}\n';

var byVersion = function byVersion(a, b) {
  return semver.lt(a, b) ? -1 : semver.gt(a, b) ? 1 : 0;
};

var IndexPage = function (_React$Component) {
  _inherits(IndexPage, _React$Component);

  function IndexPage() {
    _classCallCheck(this, IndexPage);

    return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
  }

  IndexPage.prototype.render = function render() {
    var _props = this.props,
        packageInfo = _props.packageInfo,
        version = _props.version,
        dir = _props.dir,
        entries = _props.entries;


    var versions = Object.keys(packageInfo.versions).sort(byVersion);
    var options = versions.map(function (v) {
      return React.createElement(
        'option',
        { key: v, value: v },
        packageInfo.name,
        '@',
        v
      );
    });

    return React.createElement(
      'html',
      null,
      React.createElement(
        'head',
        null,
        React.createElement('meta', { charSet: 'utf-8' }),
        React.createElement(
          'title',
          null,
          'Index of ',
          dir
        ),
        React.createElement('style', { dangerouslySetInnerHTML: { __html: IndexPageStyle } })
      ),
      React.createElement(
        'body',
        null,
        React.createElement(
          'div',
          { className: 'version-wrapper' },
          React.createElement(
            'select',
            { id: 'version', defaultValue: version },
            options
          )
        ),
        React.createElement(
          'h1',
          null,
          'Index of ',
          dir
        ),
        React.createElement('script', { dangerouslySetInnerHTML: { __html: IndexPageScript } }),
        React.createElement('hr', null),
        React.createElement(DirectoryListing, { dir: dir, entries: entries }),
        React.createElement('hr', null),
        React.createElement(
          'address',
          null,
          packageInfo.name,
          '@',
          version
        )
      )
    );
  };

  return IndexPage;
}(React.Component);

IndexPage.propTypes = {
  packageInfo: PropTypes.object.isRequired,
  version: PropTypes.string.isRequired,
  dir: PropTypes.string.isRequired,
  entries: PropTypes.array.isRequired
};


module.exports = IndexPage;