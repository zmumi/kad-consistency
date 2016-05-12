'use strict';

var async = require('async');
var Message = require('kad/lib/message');

module.exports = {
  softTimeout: softTimeout,
  validator: isTimeoutError
};

function isTimeoutError(result) {
  return result instanceof Error && result.code === 'ETIMEDOUT'
}

function softTimeout(timeout, theFunction, callback) {
  async.timeout(theFunction, timeout)(function (err, reply) {
    if (err && err.code == 'ETIMEDOUT') {
      callback(null, err)
    } else {
      callback(err, reply)
    }
  })
}