'use strict';

var expect = require('chai').expect;
var Consistency = require('../index').ConsistentNode;
var kad = require('kad');
var ConsistentNode = Consistency(kad.Node);
var transports = kad.transports;
var Logger = kad.Logger;
var AddressPortContact = kad.contacts.AddressPortContact;
var MemStore = require('kad-memstore');


it('should store local copy for republishing purposes on put', function (done) {

  var node1 = ConsistentNode({
    transport: transports.HTTP(AddressPortContact({
      address: '127.0.0.17',
      port: 10001
    })),
    storage: new MemStore(),
    logger: new Logger(0)
  });

  var node2 = ConsistentNode({
    transport: transports.HTTP(AddressPortContact({
      address: '127.0.0.14',
      port: 10002
    })),
    storage: new MemStore(),
    logger: new Logger(0)
  });

  var node3 = ConsistentNode({
    transport: transports.HTTP(AddressPortContact({
      address: '127.0.0.11',
      port: 10003
    })),
    storage: new MemStore(),
    logger: new Logger(0)
  });

  node2.connect(node1._self, function (err) {
    expect(err).to.not.exist;
    node3.connect(node1._self, function (err) {
      expect(err).to.not.exist;

      // node2
      node2.put('some-key', 'some-val', function(err){
        node2._storage.get('some-key', function(err, value){
          expect(err).to.not.exist;
          expect(value).to.exist;

          // node3
          node3.put('other-key', 'other-val', function(err){
            node3._storage.get('other-key', function(err, value){
              expect(err).to.not.exist;
              expect(value).to.exist;

              // node1
              node1.put('final-key', 'final-val', function(err){
                node1._storage.get('final-key', function(err, value){
                  expect(err).to.not.exist;
                  expect(value).to.exist;
                  done()
                });
              });
            });
          });
        });
      });
    });
  });
});
