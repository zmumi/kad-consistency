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
    requestTimeout: 30,
    maxPutTimeoutsRatio: 0.3,
    maxPutConflictsRatio: 0.2,
    minGetCommonRatio: 0.6
  },
  scenario: {
    peerCount: 101,
    objectCount: 127,
    readsPerObject: 0,
    updatesPerObject: 7,
    postUpdateReadsPerObject: 0
  },
  malfunctions: {
    messageLossProbability: 0.0,
    valuePoisoningProbability: 0.0,
    publisherPoisoningProbability: 0.0,
    rationalPeerProbability: 0.0
  },
  runName: 'publisher-poisoning/results'
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
    values: [0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28],
    setter: function (params, val) {
      params.malfunctions.publisherPoisoningProbability = val;
      return params
    }
  }
];

var getGroup = function (data) {
  return data.options.useExtension
};
var getX = function (data) {
  return data.options.malfunctions.publisherPoisoningProbability * 100
};
var getY = function (data) {
  return data.results.update.failures / data.results.update.count * 100
};
var dataJsTransformer = getRawOutputToDataJsTransformer(getGroup, getX, getY);

async.eachLimit(mutateParameters(defaultParameters, mutators), 4, runSeparateProcess, function (err, done) {
  fs.readFile(__dirname + '/results.raw', 'utf8', function (err, data) {
    dataJsTransformer(data, function (err, js) {
      fs.writeFile(__dirname + '/data.js', js, done);
    })
  });
});
