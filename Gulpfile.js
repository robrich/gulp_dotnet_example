/*jshint node:true */

"use strict";

var gulp = require('gulp');
var exec = require('child_process').exec;
var async = require('async');
var fs = require('fs');
var Q = require('q');
var rimraf = require('rimraf');
var setVersion = require('./gulpLib/setVersionTask');

var gitHash;
var buildNumber;
var noop = function () {};

gulp.verbose = true; // show start and end for each task

gulp.task('clean', function(){
	var deferred = Q.defer();

	// TODO: delete obj, Debug, Release
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
					cb('git failed, exit code '+error.code);
				}
				cb(null);
			});
		}
	], function (err) {
		if (err) {
			throw new Error(err);
			//deferred.reject(err);
		}
		deferred.resolve();
	});

	return deferred.promise;
});

gulp.task('version', ['getGitHash','getBuildNumber','setVersion'], noop);

gulp.task('build', ['clean','version'], function(){
	var deferred = Q.defer();
	var sln = 'GulpTarget.sln';
	var args = [
		'/m',
		//'/p:OutputPath=D:\\JenkinsDrops\\WSB_All\\',
		'/property:Configuration=Release',
		'/verbosity:minimal',
		'/fileLoggerParameters:LogFile=log\\GulpTarget.log',
		'/target:Clean,Rebuild'
	];

	buildSolution(sln, args, function (err) {
		if (err) {
			throw new Error(err);
			//deferred.jreject(err);
		}

// !!!!! copy web projects and test projects to dist

		deferred.resolve();
	});

	return deferred.promise;
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

var buildSolution = function (sln, args, cb) {
	fs.mkdir('log', function (err) {
		if (err) {
			return cb(err);
		}
		var cmds = [
			"C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\msbuild.exe",
			sln.replace('/','\\')
		].concat(args);
		var cmd = '"'+cmds.join('" "')+'"';
		console.log("cmd: "+cmd);
		exec(cmd, function (error, stdout, stderr) {
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
				cb('msbuild failed, exit code '+error.code);
			}
			cb(null);
		});
	});
};


// default task gets called when you run the `gulp` command
gulp.task('default', ['clean', 'version', 'build', 'test', 'deploy'], noop);
