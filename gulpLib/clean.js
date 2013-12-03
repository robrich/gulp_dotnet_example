/*jshint node:true */

"use strict";

var async = require('async');
var rimraf = require('rimraf');
var gulp = require('gulp');
var gulpRimraf = require('gulp-rimraf');
var ignore = require('gulp-ignore');
var verbose = require('./lib/gulp-verbose');
var exec = require('child_process').exec;


var opts;

var setOpts = function (o) {
	opts = o;
};

var cleanUnversioned = function (cb) {
	async.parallel([
		function (cba) {
			rimraf('./dist', cba);
		},
		function (cbb) {
			rimraf('./log', cbb);
		},
		function (cbc) {
			var mess = opts.verbose ? 'deleting $file' : '';
			var stream = gulp.src('{**/bin,**/obj,**/Debug,**/Release,./Web/m}',{read:false})
				.pipe(ignore({pattern:['node_modules/**','packages/**']}))
				.pipe(verbose(mess))
				.pipe(gulpRimraf());
			stream.once('end', cbc);
		}
	], cb);
};

var cleanVersioned = function (cb) {
	exec('git reset --hard', function (error, stdout, stderr) {
		if (stderr) {
			console.log(stderr);
		}
		if (stdout) {
			stdout = stdout.trim(); // Trim trailing cr-lf
		}
		if (stdout && opts.verbose) {
			console.log(stdout);
		}
		if (error) {
			cb('git failed, exit code '+error.code);
		}
		cb(null);
	});
};

module.exports = {
	cleanUnversioned: cleanUnversioned,
	cleanVersioned: cleanVersioned,
	setOpts : setOpts
};
