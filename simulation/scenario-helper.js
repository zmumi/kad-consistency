var fs = require('fs');
var async = require('async');
var spawn = require('child_process').spawn;
var getRawOutputToDataJsTransformer = require('./data-to-js').getRawOutputToDataJsTransformer;

function runSeparateProcess(param, done) {
  var child = spawn(process.execPath, [__dirname + '/simulation.js', JSON.stringify(param)]);
  child.stdout.on('end', done);
  child.stdout.on('data', function (buffer) {
    console.log(buffer.toString())
  });
  child.stderr.on('data', function (buffer) {
    console.error(buffer.toString())
  });
}

function run(parameters, resultsDir, concurrencyLimit) {
  var dataJsTransformer = getRawOutputToDataJsTransformer();
  async.eachLimit(parameters, concurrencyLimit || 4, runSeparateProcess, function (err, done) {
    fs.readFile(resultsDir + '/results.raw', 'utf8', function (err, data) {
      dataJsTransformer(data, function (err, js) {
        fs.writeFile(resultsDir + '/data.js', js, done);
      })
    });
  });
}

module.exports = {run: run};