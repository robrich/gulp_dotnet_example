/*jshint node:true */

"use strict";

var exec = require('child_process').exec;
var gulp = require('gulp');
var ignore = require('./lib/gulp-ignore');
var verbose = require('./lib/gulp-verbose');
var gulpSetVersion = require('./lib/gulp-setVersion');
var gulpExec = require('gulp-exec');


var opts;

var setOpts = function (o) {
	opts = o;
};

var getGitHash = function (callback) {
	exec('git log -1 --format=%h', function (error, stdout, stderr) {
		if (stderr) {
			console.log(stderr);
		}
		if (stdout) {
			stdout = stdout.trim(); // Trim trailing cr-lf
		}
		if (error) {
			console.log('git errored with exit code '+error.code);
			callback(error);
			return;
		}
		if (!stdout) {
			callback(new Error('git log retured no results'));
		}
		opts.gitHash = stdout;
		console.log("gitHash: '" + opts.gitHash + "'");
		callback(null, opts.gitHash);
	});
};

var setVersion = function (callback) {
	var mess = opts.verbose ? 'set version '+opts.gitHash+', '+opts.buildNumber+' in $file' : '';
	var stream = gulp.src("./**/*AssemblyInfo.cs")
		.pipe(ignore("./dist"))
		.pipe(verbose(mess))
		.pipe(gulpSetVersion(opts.gitHash, opts.buildNumber))
		.pipe(gulp.dest("./"));
	stream.once('end', callback);
};

// Helpful for develpers who want to put it back, not directly referenced by the build
var revertVersion = function (callback) {
	var stream = gulp.src("./**/*AssemblyInfo.cs")
		.pipe(ignore("./dist"))
		.pipe(gulpExec('git checkout $file'));
	stream.once('end', callback);
};

module.exports = {
	getGitHash: getGitHash,
	setVersion: setVersion,
	revertVersion: revertVersion,
	setOpts: setOpts
};
