#!/usr/bin/env node

function ValuePoisonousStorageWrapper(store) {
  this.store = store;
}

ValuePoisonousStorageWrapper.prototype.put = function (key, value, callback) {
  var item = JSON.parse(value);
  item.value = 'FORGED-VALUE';
  var newValue = JSON.stringify(item);
  return this.store.put(key, newValue, callback)
};

ValuePoisonousStorageWrapper.prototype.get = function (key, callback) {
  return this.store.get(key, callback)
};

ValuePoisonousStorageWrapper.prototype.del = function (key, callback) {
  return this.store.del(key, callback)
};

ValuePoisonousStorageWrapper.prototype.createReadStream = function () {
  return this.store.createReadStream()
};

module.exports = ValuePoisonousStorageWrapper;