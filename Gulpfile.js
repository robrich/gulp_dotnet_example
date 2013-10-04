/*jshint node:true */

"use strict";

var gulp = require('gulp');
var exec = require('child_process').exec;
var async = require('async');
var Q = require('q');
var rimraf = require('rimraf');
var setVersion = require('./gulpLib/setVersionTask');


var gitHash;
var buildNumber;
var noop = function () {};

gulp.verbose = true; // show start and end for each task

gulp.task('clean', function(){
	var deferred = Q.defer();

	async.parallel([
		function (cb) {
			rimraf('./dist', cb);
		},
		function (cb) {
			rimraf('./log', cb);
		},
		function (cb) {
			// TODO: remove echo once we're done debugging !!!!!
			exec('echo git reset --hard', function (error, stdout, stderr) {
				if (stderr) {
					console.log(stderr);
				}
				if (stdout) {
					stdout = stdout.replace(/[\r\n]+/g,'');
				}
				if (stdout) {
					console.log(stdout);
				}
				if (error) {
					cb('git errored with exit code '+error.code);
				}
				cb(null);
			});
		}
	], function (err) {
		if (err) {
			throw new Error(err);
			//deferred.reject(error);
		}
		deferred.resolve();
	});

	return deferred.promise;
});

gulp.task('version', ['getGitHash','getBuildNumber','setVersion'], noop);

gulp.task('build', ['clean','version'], function(){
	console.log('build');
});

gulp.task('test', ['build'], function(){
	console.log('test');
});

gulp.task('deploy', ['build','test'], function(){
	console.log('deploy');
});



gulp.task('getGitHash', function () {
	var deferred = Q.defer();
	exec('git log -1 --format=%h', function (error, stdout, stderr) {
		if (stderr) {
			console.log(stderr);
		}
		if (error) {
			console.log('git errored with exit code '+error.code);
			deferred.reject(error);
			return;
		}
		if (!stdout) {
			deferred.reject(new Error('git log retured no results'));
			return;
		}
		gitHash = stdout.replace(/[\r\n]+/g,'');
		console.log("gitHash: '" + gitHash + "'");
		deferred.resolve(gitHash);
	});
	return deferred.promise;
});

gulp.task('getBuildNumber', function () {
	// runs synchronously, no need to wait for it
	buildNumber = process.env.BUILD_NUMBER;
	buildNumber = '75';
	if (buildNumber) {
		console.log("BUILD_NUMBER: '"+buildNumber+"'");
	} else {
		console.log("BUILD_NUMBER: "+buildNumber);
	}
});

gulp.task('setVersion', ['clean', 'getGitHash', 'getBuildNumber'], function () {
	// TODO: Why does this not ignore the dist directory?
	gulp.src("./**/*AssemblyInfo.cs", {ignore: ["dist"]})
		.pipe(setVersion(gitHash, buildNumber))
		.pipe(gulp.dest("./dist"));
});



// default task gets called when you run the `gulp` command
gulp.task('default', ['clean', 'version', 'build', 'test', 'deploy'], noop);
