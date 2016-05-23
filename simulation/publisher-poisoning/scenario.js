#!/usr/bin/env node

var mutateParameters = require('../parameter-mutation');
var run = require('../scenario-helper').run;

var defaultParameters = {
  useExtension: false,
  concurrentOps: 10,
  peerOptions: {
    requestTimeout: 1000,
    maxPutTimeoutsRatio: 0.3,
    maxPutConflictsRatio: 0.2,
    minGetCommonRatio: 0.51,
    maxGetTimeoutsRatio: 0.49
  },
  scenario: {
    peerCount: 128,
    objectCount: 160,
    readsPerObject: 0,
    updatesPerObject: 8,
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
    //values: [1, 2, 3, 4, 5],
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
    values: [0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24],
    setter: function (params, val) {
      params.malfunctions.publisherPoisoningProbability = val;
      return params
    }
  }, {
    values: [0, 0.01, 0.02, 0.03, 0.04],
    setter: function (params, val) {
      params.malfunctions.messageLossProbability = val;
      return params
    }
  }
];

run(mutateParameters(defaultParameters, mutators), __dirname, 12);