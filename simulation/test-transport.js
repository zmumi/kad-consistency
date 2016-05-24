#!/usr/bin/env node

var kad = require('kad');
var inherits = require('util').inherits;


inherits(TestTransport, kad.RPC);

function TestTransport(contact, options) {
  if (!(this instanceof TestTransport)) {
    return new TestTransport(contact, options);
  }
  kad.RPC.call(this, contact, options);
}

TestTransport.messageLossProbability = 0;
TestTransport.latency = 0;
TestTransport.all = {};

TestTransport.prototype._open = function (done) {
  TestTransport.all[this._contact.port] = this;
  done()
};

TestTransport.prototype._send = function (data, contact) {
  var shouldDrop = Math.random() < TestTransport.messageLossProbability;
  if (TestTransport.all[contact.port] && !shouldDrop) {
    setTimeout(function () {
      try {
        TestTransport.all[contact.port].receive(data);
      } catch (e) {
        console.error(e)
      }
    }, TestTransport.latency)
  } else {
    var message = kad.Message.fromBuffer(data);
    var pendingCall = this._pendingCalls[message.id];
    if (pendingCall) {
      var callback = pendingCall.callback;
      pendingCall.callback = function () {
      };
      var error = new Error('test-transport-timeout');
      error.code = 'ETIMEDOUT';
      callback(error);
    }
  }
};

TestTransport.prototype._close = function () {
};

module.exports = TestTransport;