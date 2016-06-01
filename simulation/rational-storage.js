#!/usr/bin/env node

function RationalStorageWrapper(store) {
  this.store = store;
}

RationalStorageWrapper.prototype.put = function (key, value, callback) {
  return callback()
};

RationalStorageWrapper.prototype.get = function (key, callback) {
  return this.store.get(key, callback)
};

RationalStorageWrapper.prototype.del = function (key, callback) {
  return this.store.del(key, callback)
};

RationalStorageWrapper.prototype.createReadStream = function () {
  return this.store.createReadStream()
};

module.exports = RationalStorageWrapper;