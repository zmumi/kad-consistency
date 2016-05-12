'use strict';

var async = require('async');
var util = require('util');
var Message = require('kad/lib/message');

module.exports = {
  conflicts: conflicts,
  timeouts: timeouts,
  notFound: notFound
};

function conflicts(conflicting, total, allowance) {
  var msg = util.format('Too many conflicts (%d of %d; allowed: %d%%)', conflicting, total, allowance * 100);
  return {
    message: msg,
    code: 'CONFLICT'
  }
}

function timeouts(timeouts, total, allowance) {
  var msg = util.format('Too many timeouts (%d of %d; allowed: %d%%)', timeouts, total, allowance * 100);
  return {
    message: msg,
    code: 'TIMEOUT'
  }
}

function notFound(hits, total, expectance) {
  var msg = util.format('Too few agreeing reads (%d of %d; required: %d%%)', hits, total, expectance * 100);
  return {
    message: msg,
    code: 'NOT_FOUND'
  }
}