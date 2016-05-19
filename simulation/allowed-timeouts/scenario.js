#!/usr/bin/env node

var fs = require('fs');
var async = require('async');
var spawn = require('child_process').spawn;
var mutateParameters = require('../parameter-mutation');
var getRawOutputToDataJsTransformer = require('../data-to-js').getRawOutputToDataJsTransformer;

function runSeparateProcess(param, done) {
  var child = spawn(process.execPath, [__dirname + '/../simulation.js', JSON.stringify(param)]);
  child.stdout.on('end', done);
  child.stdout.on('data', function (buffer) {
    console.log(buffer.toString())
  });
}

var defaultParameters = {
  useExtension: false,
  peerOptions: {
    requestTimeout: 40,
    maxPutTimeoutsRatio: 0.3,
    maxGetTimeoutsRatio: 0.3,
    maxPutConflictsRatio: 0.2,
    minGetCommonRatio: 0.6
  },
  scenario: {
    peerCount: 101,
    objectCount: 127,
    readsPerObject: 0,
    updatesPerObject: 1,
    postUpdateReadsPerObject: 7
  },
  malfunctions: {
    messageLossProbability: 0.05,
    valuePoisoningProbability: 0.1,
    publisherPoisoningProbability: 0.0,
    rationalPeerProbability: 0.0
  },
  runName: 'allowed-timeouts/results'
};

var mutators = [
  {
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    setter: function (params) {
      return params
    }
  }, {
    values: [true],
    setter: function (params, val) {
      params.useExtension = val;
      return params
    }
  }, {
    values: [0, 0.03, 0.06, 0.09, 0.12],
    setter: function (params, val) {
      params.malfunctions.messageLossProbability = val;
      return params
    }
  }, {
    values: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4],
    setter: function (params, val) {
      params.peerOptions.maxGetTimeoutsRatio = val;
      return params
    }
  }
];

var dataJsTransformer = getRawOutputToDataJsTransformer();

async.eachLimit(mutateParameters(defaultParameters, mutators), 12, runSeparateProcess, function (err, done) {
  fs.readFile(__dirname + '/results.raw', 'utf8', function (err, data) {
    dataJsTransformer(data, function (err, js) {
      fs.writeFile(__dirname + '/data.js', js, done);
    })
  });
});