'use strict';

var isOwnershipError = require('./ownership').validator;
var isTimeout = require('./timeouts').validator;
var errors = require('./errors');

module.exports = Rules;

function Rules(options) {
  if (!(this instanceof Rules)) {
    return new Rules(options);
  }
  options = options || {};

  this._logger = options.logger;
  this._options = {
    maxPutTimeoutsRatio: 0.2 || options.maxPutTimeoutsRatio,
    maxGetTimeoutsRatio: 0.2 || options.maxGetTimeoutsRatio,
    maxPutConflictsRatio: 0.1 || options.maxPutConflictsRatio,
    minGetCommonRatio: 0.5 || options.minGetCommonRatio
  };
}

Rules.prototype.resolve_put_result = function (results, callback) {
  var total = results.length;
  var timeouts = 0;
  var ownershipClashes = 0;

  results.forEach(function (res) {
    if (isTimeout(res)) timeouts++;
    if (isOwnershipError(res)) ownershipClashes++;
  }, results);

  if (ownershipClashes / total > this._options.maxPutConflictsRatio) {
    var conflictsError = errors.conflicts(ownershipClashes, total, this._options.maxPutConflictsRatio);
    this._logger.error(conflictsError.message);
    callback(conflictsError)
  } else if (timeouts / total > this._options.maxPutTimeoutsRatio) {
    var timeoutsError = errors.timeouts(timeouts, total, this._options.maxPutTimeoutsRatio);
    this._logger.error(timeoutsError.message);
    callback(timeoutsError)
  } else {
    this._logger.info('Put results conform with the rules');
    callback()
  }
};


Rules.prototype.resolve_get_result = function (results, callback) {
  var total = results.length;
  var timeouts = 0;
  var entries = {};
  var entryCounts = {};

  results.forEach(function (res) {
    if (isTimeout(res.error)) timeouts++;
    if (res && res.result && res.result.item) {
      var item = res.result.item;
      var key = item.key + item.value + item.publisher;
      entries[key] = item;
      entryCounts[key] = entryCounts[key] ? entryCounts[key] + 1 : 1;
    }
  }, results);

  var max = 0;
  var result = {};
  Object.keys(entryCounts).forEach(function (key) {
    if (entryCounts[key] > max) {
      max = entryCounts[key];
      result = entries[key]
    }
  }, results);

  if (max / total < this._options.minGetCommonRatio) {
    var notFoundError = errors.notFound(max, total, this._options.minGetCommonRatio);
    this._logger.error(notFoundError.message);
    callback(notFoundError)
  } else {
    this._logger.info('Get results conform with the rules');
    callback(null, result.value)
  }
};
