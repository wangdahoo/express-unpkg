'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var PropTypes = require('prop-types');
var prettyBytes = require('pretty-bytes');

var _require = require('../FileUtils'),
    getContentType = _require.getContentType;

var formatTime = function formatTime(time) {
  return new Date(time).toISOString();
};

var DirectoryListing = function (_React$Component) {
  _inherits(DirectoryListing, _React$Component);

  function DirectoryListing() {
    _classCallCheck(this, DirectoryListing);

    return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
  }

  DirectoryListing.prototype.render = function render() {
    var _props = this.props,
        dir = _props.dir,
        entries = _props.entries;


    var rows = entries.map(function (_ref, index) {
      var file = _ref.file,
          stats = _ref.stats;

      var isDir = stats.isDirectory();
      var href = file + (isDir ? '/' : '');

      return React.createElement(
        'tr',
        { key: file, className: index % 2 ? 'odd' : 'even' },
        React.createElement(
          'td',
          null,
          React.createElement(
            'a',
            { title: file, href: href },
            file
          )
        ),
        React.createElement(
          'td',
          null,
          isDir ? '-' : getContentType(file)
        ),
        React.createElement(
          'td',
          null,
          isDir ? '-' : prettyBytes(stats.size)
        ),
        React.createElement(
          'td',
          null,
          isDir ? '-' : formatTime(stats.mtime)
        )
      );
    });

    if (dir !== '/') rows.unshift(React.createElement(
      'tr',
      { key: '..', className: 'odd' },
      React.createElement(
        'td',
        null,
        React.createElement(
          'a',
          { title: 'Parent directory', href: '../' },
          '..'
        )
      ),
      React.createElement(
        'td',
        null,
        '-'
      ),
      React.createElement(
        'td',
        null,
        '-'
      ),
      React.createElement(
        'td',
        null,
        '-'
      )
    ));

    return React.createElement(
      'table',
      null,
      React.createElement(
        'thead',
        null,
        React.createElement(
          'tr',
          null,
          React.createElement(
            'th',
            null,
            'Name'
          ),
          React.createElement(
            'th',
            null,
            'Type'
          ),
          React.createElement(
            'th',
            null,
            'Size'
          ),
          React.createElement(
            'th',
            null,
            'Last Modified'
          )
        )
      ),
      React.createElement(
        'tbody',
        null,
        rows
      )
    );
  };

  return DirectoryListing;
}(React.Component);

DirectoryListing.propTypes = {
  dir: PropTypes.string.isRequired,
  entries: PropTypes.array.isRequired
};


module.exports = DirectoryListing;