#!/usr/bin/env node

var mutateParameters = require('../parameter-mutation');
var run = require('../scenario-helper').run;

var defaultParameters = {
  useExtension: false,
  peerOptions: {
    requestTimeout: 400,
    maxPutTimeoutsRatio: 0.49,
    maxPutConflictsRatio: 0.49,
    minGetCommonRatio: 0.51,
    maxGetTimeoutsRatio: 0.49
  },
  scenario: {
    peerCount: 128,
    objectCount: 160,
    readsPerObject: 0,
    updatesPerObject: 1,
    postUpdateReadsPerObject: 8
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
    //values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    values: [1, 2, 3],
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

run(mutateParameters(defaultParameters, mutators), __dirname);