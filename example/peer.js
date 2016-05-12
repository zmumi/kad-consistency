'use strict';

var async = require('async');
var kad = require('kad');
var consistency = require('../index'); // replace with: require('kad-consistency');
var Node = consistency.ConsistentNode(kad.Node);

var serverCount = 70;
var nodes = [];

for (var i = 0; i < serverCount; i++) {
  nodes[i] = new Node({
    transport: kad.transports.UDP(kad.contacts.AddressPortContact({
      address: '127.0.0.1',
      port: 3000 + i
    })),
    storage: kad.storage.MemStore(),
    logger: new kad.Logger(2, '@' + i)
  });
}

async.each(nodes, function (node, done) {
  node.connect(kad.contacts.AddressPortContact({
    address: '127.0.0.1',
    port: 3000 + ((i - 1) % serverCount)
  }), done)
}, function () {
  async.each(nodes, function (node, done) {
    node.put('k', 'v', done)
  }, console.error)
});