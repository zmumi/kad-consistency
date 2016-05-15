#!/usr/bin/env node

function getRawOutputToDataJsTransformer(getGroup, getX, getY) {
  return function (data, callback) {
    var parsed = data.trim().split('\n').map(JSON.parse);
    var groups = {};
    parsed.forEach(function (object) {
      groups[getGroup(object)] = groups[getGroup(object)] || [];
      groups[getGroup(object)].push({x: getX(object), y: getY(object)})
    });

    Object.keys(groups).map(function (i) {
      var sorted = groups[i].sort(function (a, b) {
        return a.x - b.x
      });
      groups[i] = {
        x: sorted.map(function (a) {
          return a.x
        }),
        y: sorted.map(function (a) {
          return a.y
        })
      }
    });

    callback(null, 'var DATA = ' + JSON.stringify(groups))
  }
}

module.exports = {getRawOutputToDataJsTransformer: getRawOutputToDataJsTransformer};