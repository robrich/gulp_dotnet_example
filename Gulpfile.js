/*jshint node:true */

"use strict";

var gulp = require('gulp');
var exec = require('child_process').exec;
var Q = require('q');


var gitHash;

gulp.task('clean', function(){
	console.log('clean');
	var deferred = Q.defer();
	// TODO: remove echo once we're done debugging !!!!!
	exec('echo git reset --hard', function (error, stdout, stderr) {
		if (stderr) {
			console.log(stderr);
		}
		if (error) {
			console.log('git errored with exit code '+error.code);
			deferred.reject(error);
			return;
		}
		if (stdout) {
			console.log(stdout);
		}
		deferred.resolve();
	});
	return deferred.promise;
});

gulp.task('version', ['getVersion'], function(){
	console.log('version');
});

gulp.task('build', ['clean','version'], function(){
	console.log('build');
});

gulp.task('test', ['build'], function(){
	console.log('test');
});

// If you're going to deploy without build and test you probably have a good reason
gulp.task('deploy', function(){
	console.log('deploy');
});

gulp.task('getVersion', function () {
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
		console.log('gitHash: [' + gitHash + ']');
		deferred.resolve(gitHash);
	});
	return deferred.promise;
});



// default task gets called when you run the `gulp` command
gulp.task('default', function(){
	gulp.run('clean', 'version', 'build', 'test', 'deploy');
});
