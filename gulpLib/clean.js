/*jshint node:true */

"use strict";

var async = require('async');
var rimraf = require('rimraf');
var gulp = require('gulp');
var gulpRimraf = require('gulp-rimraf');
var ignore = require('./lib/gulp-ignore');
var exec = require('child_process').exec;

var cleanUnversioned = function (cb) {
	async.parallel([
		function (cba) {
			rimraf('./dist', cba);
		},
		function (cbb) {
			rimraf('./log', cbb);
		},
		function (cbc) {
			var stream = gulp.src('{**/bin,**/obj,**/Debug,**/Release}')
				.pipe(ignore(['node_modules','packages']))
				.pipe(gulpRimraf());
			stream.once('end', cbc);
		}
	], cb);
};

var cleanVersioned = function (cb) {
	// TODO: remove echo once we're done debugging !!!!!
	exec('echo git reset --hard', function (error, stdout, stderr) {
		if (stderr) {
			console.log(stderr);
		}
		if (stdout) {
			stdout = stdout.trim(); // Trim trailing cr-lf
		}
		if (stdout) {
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
	cleanVersioned: cleanVersioned
};
