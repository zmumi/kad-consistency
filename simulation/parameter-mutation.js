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
  return shuffle(parametersList);
}

// Fisher-Yates (aka Knuth) Shuffle
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

module.exports = mutateParameters;