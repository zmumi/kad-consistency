'use strict';

module.exports = {
  storage_wrapper: OwnershipStorageWrapper,
  validator: isOwnershipError
};

function OwnershipStorageWrapper(store, logger) {
  if (!(this instanceof OwnershipStorageWrapper)) {
    return new OwnershipStorageWrapper(store, logger);
  }
  this._logger = logger;
  this.store = store;
  this.locks = {};
}

OwnershipStorageWrapper.prototype.put = function (key, value, callback) {
  var item = JSON.parse(value);
  var done = callback;

  if (this.locks[key] === item.publisher) {
    this._logger.warn("Overlapping updates of %s from %s - ignoring", key, item.publisher);
    callback();
    return;
  } else if (this.locks[key]) {
    this._logger.error("Conflicting update of %s in progress - update from %s rejected", key, item.publisher);
    callback(new Error('Conflicting update running'), null);
    return;
  } else {
    this._logger.debug("Locking key %s for %s", key, item.publisher);
    this.locks[key] = item.publisher;
    done = function (err, val) {
      this.locks[key] = false;
      callback(err, val)
    }.bind(this);
  }


  this.store.get(key, function (err, currentValue) {
    var currentItem = JSON.parse(currentValue || 'null');
    if (currentItem === null || item.publisher === currentItem.publisher) {
      this.store.put(key, value, done);
    } else {
      this._logger.error("Update of %s would overwrite publisher - update from %s rejected", key, item.publisher);
      done(new Error('Publisher node IDs mismatch'), currentValue)
    }
  }.bind(this));
};

OwnershipStorageWrapper.prototype.get = function (key, callback) {
  this.store.get(key, callback)
};

OwnershipStorageWrapper.prototype.del = function (key, callback) {
  this.store.del(key, callback)
};

OwnershipStorageWrapper.prototype.createReadStream = function () {
  return this.store.createReadStream()
};

function isOwnershipError(result) {
  return result && result.error && result.error.message &&
    (result.error.message === 'Publisher node IDs mismatch' || result.error.message === 'Conflicting update running')
}