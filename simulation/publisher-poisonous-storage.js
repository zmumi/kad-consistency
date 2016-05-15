#!/usr/bin/env node

function PublisherPoisonousStorageWrapper(store) {
  this.store = store;
}

PublisherPoisonousStorageWrapper.prototype.put = function (key, value, callback) {
  var store = this.store;
  return store.put(key, value, function (err) {
    store.del(key, function () {
      var item = JSON.parse(value);
      item.publisher = '0000000000000000000000000000000000000007';
      var newValue = JSON.stringify(item);
      store.put(key, newValue, function(){
        callback(err)
      })
    })
  })
};

PublisherPoisonousStorageWrapper.prototype.get = function (key, callback) {
  return this.store.get(key, callback)
};

PublisherPoisonousStorageWrapper.prototype.del = function (key, callback) {
  return this.store.del(key, callback)
};

PublisherPoisonousStorageWrapper.prototype.createReadStream = function () {
  return this.store.createReadStream()
};

module.exports = PublisherPoisonousStorageWrapper;