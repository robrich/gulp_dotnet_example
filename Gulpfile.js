/*jshint node:true */

"use strict";

var gulp = require('gulp');
var exec = require('child_process').exec;
var async = require('async');
var fs = require('fs');
var Q = require('q');
var rimraf = require('rimraf');
var setVersion = require('./gulpLib/setVersionTask');

var solutionName = 'GulpTarget';
var solutionFile = solutionName+'.sln';
var platform = 'Any CPU';
var msbuildVerbosity = 'Minimal';
var configuration = 'Release';

// Release: debug = 'false'; debugConditional = '';
// Debug: debug = 'true'; debugConditional = 'DEBUG;TRACE';
var debug = 'false';
var debugConditional = '';


var gitHash;
var buildNumber;
var noop = function () {};

gulp.verbose = true; // show start and end for each task

gulp.task('clean', function(){
	var deferred = Q.defer();

	// !!!!!!! TODO: delete obj, Debug, Release, Web/bin
	// !!!!!!! Exclude packages/** and node_modules/**

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

gulp.task('build', ['clean','version', 'buildSolution'], noop);

gulp.task('test', ['build'], function(){
	console.log('test');
});

gulp.task('deploy', ['build','test'], function(){
	console.log('deploy');
});



gulp.task('getGitHash', function (callback) {
	exec('git log -1 --format=%h', function (error, stdout, stderr) {
		if (stderr) {
			console.log(stderr);
		}
		if (error) {
			console.log('git errored with exit code '+error.code);
			callback(error);
			return;
		}
		if (!stdout) {
			callback(new Error('git log retured no results'));
		}
		gitHash = stdout.replace(/[\r\n]+/g,'');
		console.log("gitHash: '" + gitHash + "'");
		callback(null, gitHash);
	});
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

gulp.task('revertVersion', function () {
	// TODO: Why does this not ignore the dist directory?
	// !!!!!!!!!!!!!!!!!!!!!!
	gulp.src("./**/*AssemblyInfo.cs", {ignore: ["dist"]})
		.pipe(setVersion(gitHash, buildNumber))
		.pipe(gulp.dest("./dist"));
});

gulp.task('buildSolution', ['clean','version'], function(){
	var deferred = Q.defer();

	fs.mkdir('log', function (err) {
		if (err) {
			throw new Error(err);
		}
		var cmds = [
			"C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\msbuild.exe",
			solutionFile.replace('/','\\')
		];
		var args = [
			'/m',
			'/target:Clean,Rebuild',
			//'/p:OutputPath=D:\\JenkinsDrops\\WSB_All\\',
			'/property:Configuration='+configuration,
			'/verbosity:'+msbuildVerbosity,
			'/p:DefineConstants="'+debugConditional+'"',
			'/p:debug='+debug,
			'/p:trace='+debug,
			//'/noconsolelogger',
			'/fileLogger',
			'/fileloggerparameters:logfile=log\\'+solutionName+'.msbuild.log'
		];
		var cmd = '"'+cmds.concat(args).join('" "')+'"';
		console.log("buildSolution: "+cmd);
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
				throw new Error('msbuild failed, exit code '+error.code);
			}
			deferred.resolve();
		});
	});

	return deferred.promise;
});

var copyProject = function (proj, projName, dest, cb) {
	fs.mkdir('log', function (err) {
		if (err) {
			return cb(err);
		}

		// TODO: partial path to full path
		var destBackslash = dest.replace(/\//,'\\');

		var cmds = [
			"C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\msbuild.exe",
			proj.replace('/','\\')
		];
		var args = [
			'/m',
			'/target:PipelinePreDeployCopyAllFilesToOneFolder',
			'/p:_PackageTempDir='+destBackslash,
			'/property:Configuration='+configuration,
			'/verbosity:'+msbuildVerbosity,
			'/p:DefineConstants="'+debugConditional+'"',
			'/p:debug='+debug,
			'/p:trace='+debug,
			//'/noconsolelogger',
			'/fileLogger',
			'/fileloggerparameters:logfile=log\\'+projName+'-copyProject.msbuild.log'
		];
		var cmd = '"'+cmds.concat(args).join('" "')+'"';
		console.log("buildSolution: "+cmd);
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
				throw new Error('msbuild failed, exit code '+error.code);
			}

		<copy	file="${ProjectPath}/obj/${Configuration}/TransformWebConfig/transformed/Web.config"
			tofile="${Dest}/Web.config"
			overwrite="true"
			if="${file::exists(ProjectPath+'/obj/'+Configuration+'/TransformWebConfig/transformed/Web.config')}" />

		<property name="DestStash" value="${Dest}" />
		<property name="Source" value="${ProjectPath}\bin" />
		<property name="Dest" value="${DestStash}\bin" />
		<call target="CopyFolder" />
		<property name="Dest" value="${DestStash}" />

			deferred.resolve();
		});
	});
};


// default task gets called when you run the `gulp` command
gulp.task('default', ['clean', 'version', 'build', 'test', 'deploy'], noop);
