#!/usr/bin/env node

function mutateParameters(defaultParameters, mutators) {
  var parametersList = [defaultParameters];
  for (var i in mutators) {
    var mutator = mutators[i];
    var newParametersList = [];
    for (var j in mutator.values) {
      var value = mutator.values[j];
      for (var k in parametersList) {
        var parametersClone = JSON.parse(JSON.stringify(parametersList[k]));
        newParametersList.push(mutator.setter(parametersClone, value));
      }
    }
    parametersList = newParametersList;
  }
  return parametersList;
}

module.exports = mutateParameters;