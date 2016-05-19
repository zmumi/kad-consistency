#!/usr/bin/env node

function getRawOutputToDataJsTransformer(getPoints) {
  getPoints = getPoints || defaultGetPoints;

  return function (data, callback) {
    var parsed = data.trim().split('\n').map(JSON.parse);
    var groups = {};
    parsed.forEach(function (object) {
      getPoints(object).forEach(function (point) {
        groups[point.group] = groups[point.group] || [];
        groups[point.group].push({x: point.x, y: point.y})
      })
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

function defaultGetPoints(data) {
  var xs = {
    messageLossProbability: data.options.malfunctions.messageLossProbability * 100,
    valuePoisoningProbability: data.options.malfunctions.valuePoisoningProbability * 100,
    publisherPoisoningProbability: data.options.malfunctions.publisherPoisoningProbability * 100,
    rationalPeerProbability: data.options.malfunctions.rationalPeerProbability * 100,
    maxPutTimeoutsRatio: data.options.peerOptions.maxPutTimeoutsRatio * 100,
    maxPutConflictsRatio: data.options.peerOptions.maxPutConflictsRatio * 100,
    minGetCommonRatio: data.options.peerOptions.minGetCommonRatio * 100,
  };

  var ext = '&extensions=' + data.options.useExtension;
  var loss = '&messageLossProbability=' + data.options.malfunctions.messageLossProbability;

  var points = [];
  for (var operation in data.results) {
    for (var serie in data.results[operation]) {
      for (var x in xs) {
        var id = x + '@' + operation + '.' + serie;
        var y = data.results[operation][serie] / data.results[operation].count * 100;
        points.push({group: id, x: xs[x], y: y});
        points.push({group: id + ext, x: xs[x], y: y});
        points.push({group: id + ext + loss, x: xs[x], y: y})
      }
    }
  }
  return points;
}

module.exports = {
  getRawOutputToDataJsTransformer: getRawOutputToDataJsTransformer,
  defaultGetPoints: defaultGetPoints
};