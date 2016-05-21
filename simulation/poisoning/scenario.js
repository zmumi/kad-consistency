#!/usr/bin/env node

var mutateParameters = require('../parameter-mutation');
var run = require('../scenario-helper').run;

var defaultParameters = {
  useExtension: false,
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
    readsPerObject: 8,
    updatesPerObject: 0,
    postUpdateReadsPerObject: 0
  },
  malfunctions: {
    messageLossProbability: 0.0,
    valuePoisoningProbability: 0.0,
    publisherPoisoningProbability: 0.0,
    rationalPeerProbability: 0.0
  },
  runName: 'poisoning/results'
};

var mutators = [
  {
    //values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    values: [1],
    setter: function (params) {
      return params
    }
  }, {
    values: [true, false],
    setter: function (params, val) {
      params.useExtension = val;
      return params
    }
  }, {
    values: [0, 0.06, 0.12, 0.18, 0.24, 0.3, 0.36, 0.42],
    setter: function (params, val) {
      params.malfunctions.valuePoisoningProbability = val;
      return params
    }
  }, {
    values: [0, 0.02, 0.04],
    setter: function (params, val) {
      params.malfunctions.messageLossProbability = val;
      return params
    }
  }
];

run(mutateParameters(defaultParameters, mutators), __dirname, 8);
