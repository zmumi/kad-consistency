'use strict';

var inherits = require('util').inherits;
var async = require('async');

var Message = require('kad/lib/message');
var Item = require('kad/lib/item');
var kad = require('kad');

var OwnershipStorageWrapper = require('./ownership').storage_wrapper;
var softTimeout = require('./timeouts').softTimeout;
var Rules = require('./rules');

var noop = function () {
};

function ConsistentNode(Node) {
  function ConsistentNode(options) {
    if (!(this instanceof ConsistentNode)) {
      return new ConsistentNode(options);
    }

    options.logger = options.logger || new kad.Logger(2);
    options.storage = OwnershipStorageWrapper(options.storage, options.logger);
    Node.call(this, options);
    this._rules = Rules(options);
    this._timeout = options.requestTimeout || 500;
  }

  inherits(ConsistentNode, Node);

  ConsistentNode.prototype.put = function (key, value, callback) {
    callback = callback || noop;
    var self = this;
    var item = new Item(key, value, self._self.nodeID, null);
    self._log.info('attempting to set value "%s" for key "%s"', value, key);

    this._router.findNode(item.key, function (err, contacts) {
      if (err) {
        self._log.error('attempt to set value for key "%s" failed due to no nodes found (%j)', key, err);
        callback(err);
        return;
      }

      async.map(contacts, function (contact, done) {
        var message = new Message({
          method: 'STORE',
          params: {item: item, contact: self._self}
        });
        self._send(contact, message, self._timeout, done);
      }, function (err, results) {
        if (err) {
          self._log.error('attempt to set value for key "%s" failed due to %j', key, err);
          callback(err);
        } else {
          self._rules.resolve_put_result(results, function (err) {
            if (!err) {
              // NB: Always store a local copy so we can republish later
              self._storage.put(item.key, JSON.stringify(item), callback);
            } else {
              callback(err)
            }
          });
        }
      });
    });
  };

  ConsistentNode.prototype.get = function (key, callback) {
    var self = this;
    self._log.info('attempting to get value for key "%s"', key);
    this._router.findNode(key, function (err, contacts) {
      if (err) {
        self._log.error('attempt to get value for key "%s" failed due to no nodes found (%j)', key, err);
        callback(err);
        return;
      }

      var queryContact = function (contact, callback) {
        var message = new Message({
          method: 'FIND_VALUE',
          params: {key: key, contact: self._self}
        });
        self._send(contact, message, self._timeout, callback);
      };
      async.map(contacts, queryContact, function (err, results) {
        if (err) {
          self._log.error('attempt to get value for key "%s" failed due to %j', key, err);
          callback(err);
        } else {
          self._rules.resolve_get_result(results, callback)
        }
      });
    });
  };

  ConsistentNode.prototype._send = function (contact, message, timeout, callback) {
    var rpc = this._router._rpc;
    softTimeout(timeout, function (done) {
      rpc.send(contact, message, done);
    }, callback)
  };

  return ConsistentNode;
}


module.exports = ConsistentNode;
