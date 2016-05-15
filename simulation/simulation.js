#!/usr/bin/env node

var fs = require('fs');
var async = require('async');
var kad = require('kad');
var inherits = require('util').inherits;
var consistency = require('../index'); // replace with: require('kad-consistency');
var Node = consistency.ConsistentNode(kad.Node);
var TestTransport = require('./test-transport');
var ValuePoisonousStorageWrapper = require('./value-poisonous-storage');
var PublisherPoisonousStorageWrapper = require('./publisher-poisonous-storage');
var RationalStorageWrapper = require('./rational-storage');

function range(start, stop) {
  if (stop === undefined) {
    stop = start;
    start = 0;
  }
  var range = [];
  for (var i = start; i < stop; i++) range[i - start] = i;
  return range;
}

function ignoreError(fun) {
  return function (err, x, y, z) {
    //if (err) console.error(err);
    fun(null, x, y, z)
  }
}

function getNodeOptions(port, opts) {
  var peerOptions = {
    transport: TestTransport(kad.contacts.AddressPortContact({
      address: '127.0.0.1',
      port: port
    })),
    storage: kad.storage.MemStore(),
    logger: new kad.Logger(0, '@' + port)
  };

  for (var key in opts.peerOptions) {
    peerOptions[key] = opts.peerOptions[key]
  }
  kad.constants.T_RESPONSETIMEOUT = opts.peerOptions.requestTimeout ? opts.peerOptions.requestTimeout + 5 : 200;

  return peerOptions;
}

function getPeer(nodeOptions, opts) {
  var peer = opts.useExtension ? Node(nodeOptions) : kad.Node(nodeOptions);

  var random = Math.random();
  var p = opts.malfunctions;
  if (random < p.valuePoisoningProbability) {
    peer._storage = new ValuePoisonousStorageWrapper(peer._storage);
  } else if (random < p.valuePoisoningProbability + p.publisherPoisoningProbability) {
    peer._storage = new PublisherPoisonousStorageWrapper(peer._storage);
  } else if (random < p.valuePoisoningProbability + p.publisherPoisoningProbability + p.rationalPeerProbability) {
    peer._storage = new RationalStorageWrapper(peer._storage);
  }
  return peer;
}

/***************************************/
/* scenario execution */
/***************************************/


function getPeers(opts, portOffset) {
  var peers = [];
  for (var i = 0; i < opts.scenario.peerCount; i++) {
    var port = portOffset + i;
    peers[i] = getPeer(getNodeOptions(port, opts), opts);
    peers[i].port = port;
  }
  return peers;
}

function initResults() {
  return {
    put: {
      count: 0,
      failures: 0,
      time: 0
    },
    get: {
      count: 0,
      failures: 0,
      value_failures: 0,
      time: 0
    },
    update: {
      count: 0,
      failures: 0,
      time: 0
    },
    post_update_get: {
      count: 0,
      failures: 0,
      value_failures: 0,
      time: 0
    }
  };
}

function run(opts, callback) {
  var PORT_OFFSET = 3000;
  var CONNECT_NEIGHBOURHOOD = [-2, -1, 1, 2];
  var WARM_UP_QUERIES = 20;

  console.log('Starting execution with params:', opts);

  TestTransport.messageLossProbability = opts.malfunctions.messageLossProbability;
  var objectNumbers = range(opts.scenario.objectCount);
  var peers = getPeers(opts, PORT_OFFSET);
  var results = initResults();

  function startPeers(callback) {
    var peerCount = opts.scenario.peerCount;
    async.eachSeries(peers, function (peer, done) {
      async.each(CONNECT_NEIGHBOURHOOD, function (i, done) {
        var neighbourPort = peer.port + i;
        if (neighbourPort < PORT_OFFSET) neighbourPort += peerCount;
        if (neighbourPort >= PORT_OFFSET + peerCount) neighbourPort -= peerCount;
        peer.connect(kad.contacts.AddressPortContact({
          address: '127.0.0.1',
          port: neighbourPort
        }), ignoreError(done));
      }, done)
    }, callback);
  }

  function doWarmUp(callback) {
    async.each(peers, function (peer, done) {
      var queries = [];
      for (var i = 0; i < WARM_UP_QUERIES; i++) {
        queries[i] = i;
      }
      async.eachSeries(queries, function (i, done) {
        peer.get(peer.port + '' + i, ignoreError(done));
      }, done)
    }, function () {
      setTimeout(callback, 5000)
    })
  }

  function doPuts(callback) {
    var start = Date.now();
    async.eachSeries(objectNumbers, function (i, done) {
      var peer = peers[i % opts.scenario.peerCount];
      peer.put('KEY' + i, 'VALUE-0', function (err) {
        if (err) results.put.failures += 1;
        results.put.count += 1;
        done()
      })
    }, function (err) {
      results.put.time = Date.now() - start;
      callback(err)
    });
  }

  function doUpdates(callback) {
    var start = Date.now();
    var updateNumbers = range(1, opts.scenario.updatesPerObject + 1);

    async.eachSeries(updateNumbers, function (updateNumber, done) {
      async.eachSeries(objectNumbers, function (i, done) {
        var peer = peers[i % opts.scenario.peerCount];
        peer.put('KEY' + i, 'VALUE-' + updateNumber, function (err) {
          if (err) results.update.failures += 1;
          results.update.count += 1;
          done()
        })
      }, done)
    }, function (err) {
      results.update.time = Date.now() - start;
      callback(err)
    });
  }


  function doGets(expected, readsPerObject, getResults, callback) {
    var start = Date.now();
    var reads = range(opts.scenario.objectCount * readsPerObject);

    async.eachSeries(reads, function (i, done) {
      var peer = peers[i % opts.scenario.peerCount];
      peer.get('KEY' + (i % opts.scenario.objectCount), function (err, retrieved) {
        if (err) getResults.failures += 1;
        else if (expected !== retrieved) getResults.value_failures += 1;
        getResults.count += 1;
        done()
      })
    }, function (err) {
      getResults.time = Date.now() - start;
      callback(err)
    })
  }

  function doFirstGets(callback) {
    var readsPerObject = opts.scenario.readsPerObject;
    var expected = 'VALUE-0';
    var getResults = results.get;
    doGets(expected, readsPerObject, getResults, callback);
  }

  function doPostUpdateGets(callback) {
    var readsPerObject = opts.scenario.postUpdateReadsPerObject;
    var expected = 'VALUE-' + opts.scenario.updatesPerObject;
    var getResults = results.post_update_get;
    doGets(expected, readsPerObject, getResults, callback);
  }

  async.waterfall([
    startPeers,
    doWarmUp,
    doPuts,
    doFirstGets,
    doUpdates,
    doPostUpdateGets
  ], function () {
    async.eachSeries(peers, function (peer, done) {
      peer.disconnect(done);
    }, function () {
      console.log('Results:', results);
      TestTransport.all = {};
      publishResult(opts, results, callback);
    });
  });
}


/***************************************/
/* main */
/***************************************/

var params = JSON.parse(process.argv[2] || 'false') || {
    useExtension: false,
    peerOptions: {
      requestTimeout: 30,
      maxPutTimeoutsRatio: 0.3,
      maxPutConflictsRatio: 0.2,
      minGetCommonRatio: 0.6
    },
    scenario: {
      peerCount: 10,
      objectCount: 31,
      readsPerObject: 1,
      updatesPerObject: 1,
      postUpdateReadsPerObject: 1
    },
    malfunctions: {
      messageLossProbability: 0.0,
      valuePoisoningProbability: 0.0,
      publisherPoisoningProbability: 0.9999,
      rationalPeerProbability: 0.0
    },
    runName: 'results'
  };

run(params, process.exit);

/***************************************/
/* output */
/***************************************/

function toTsv(options, header, values) {
  for (var property in options) {
    if (typeof options[property] === 'object') {
      for (var inner in options[property]) {
        header += property + '.' + inner + '\t';
        values += options[property][inner] + '\t';
      }
    } else {
      header += property + '\t';
      values += options[property] + '\t';
    }
  }
  return {header: header, values: values};
}

function publishResult(options, results, callback) {

  var withOptions = toTsv(options, '', '');
  var withResults = toTsv(results, '', '');

  var output = withOptions.header + withResults.header + '\n'
    + withOptions.values + withResults.values + '\n';

  var filename = __dirname + '/' + options.runName + '.tsv';
  fs.appendFile(filename, output, {}, callback);

  var rawOutput = JSON.stringify({options: options, results: results}) + '\n';
  filename = __dirname + '/' + options.runName + '.raw';
  fs.appendFile(filename, rawOutput, {}, callback);
}
