/*jshint node:true */

"use strict";

var gulp = require('gulp');
var exec = require('child_process').exec;
var async = require('async');
var fs = require('fs');
var Q = require('q');
var rimraf = require('rimraf');
var setVersion = require('./gulpLib/gulp-setVersion');
var ignore = require('./gulpLib/gulp-ignore');
var gulpRimraf = require('./gulpLib/gulp-rimraf');
var gulpExec = require('./gulpLib/gulp-exec');

var solutionName = 'GulpTarget';
var solutionFile = solutionName+'.sln';
var platform = 'Any CPU';
var frameworkVersion = '4.0.30319';
var msbuildVerbosity = 'Minimal';
var configuration = 'Release';

// Release: debug = 'false'; debugConditional = '';
// Debug: debug = 'true'; debugConditional = 'DEBUG;TRACE';
var debug = 'false';
var debugConditional = '';


var gitHash;
var buildNumber;
var noop = function () {};


//
// clean
//

gulp.task('cleanUnversioned', function (cb) {
	async.parallel([
		function (cb) {
			rimraf('./dist', cb);
		},
		function (cb) {
			rimraf('./log', cb);
		},
		function (cb) {
			var stream = gulp.src('{**/bin,**/obj,**/Debug,**/Release}')
				.pipe(ignore(['node_modules','packages']))
				.pipe(gulpRimraf());
			stream.once('end', cb);
		}
	], function (err) {
		if (err) {
			throw new Error(err);
			//deferred.reject(err);
		}
		cb(null);
	});
});

gulp.task('cleanVersioned', function (cb) {
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
});

//
// version
//

gulp.task('getGitHash', function (callback) {
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
		gitHash = stdout;
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

gulp.task('setVersion', ['clean', 'getGitHash', 'getBuildNumber'], function (callback) {
	// TODO: remove dist once we're done debugging !!!!!
	var stream = gulp.src("./**/*AssemblyInfo.cs")
		.pipe(ignore("./dist"))
		.pipe(setVersion(gitHash, buildNumber))
		.pipe(gulp.dest("./dist"));
	stream.once('end', callback);
});

// Helpful for develpers who want to put it back, not directly referenced by the build
// `gulp revertVersion` from a cmd
gulp.task('revertVersion', function (callback) {
	var stream = gulp.src("./**/*AssemblyInfo.cs")
		.pipe(ignore("./dist"))
		.pipe(gulpExec('git checkout $file'));
	stream.once('end', callback);
});

//
// build
//

gulp.task('buildSolution', ['clean','version'], function(callback){
	fs.mkdir('log', function (err) {
		if (err) {
			throw new Error(err);
		}
		// TODO: parameterize
		var cmds = [
			"C:\\Windows\\Microsoft.NET\\Framework\\v"+frameworkVersion+"\\msbuild.exe",
			solutionFile.replace('/','\\')
		];
		var args = [
			'/m',
			'/target:Clean,Rebuild',
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
				stdout = stdout.trim(); // Trim trailing cr-lf
			}
			if (stdout) {
				console.log(stdout);
			}
			if (error) {
				throw new Error('msbuild failed, exit code '+error.code);
			}
			callback(error);
		});
	});
});

var copyProject = function (proj, projName, dest, cb) {
	fs.mkdir('log', function (err) {
		if (err) {
			return cb(err);
		}

		// TODO: partial path to full path
		var destBackslash = dest.replace(/\//,'\\');

		var cmds = [
			"C:\\Windows\\Microsoft.NET\\Framework\\v"+frameworkVersion+"\\msbuild.exe",
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
		console.log('copyProject: projName: '+projName+', proj:'+proj+', dest: '+dest+', cmd: '+cmd);
		exec(cmd, function (error, stdout, stderr) {
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


//
// The main 5 steps: clean, version, build, test, deploy
//

gulp.verbose = true; // show start and end for each task

gulp.task('clean', ['cleanVersioned', 'cleanUnversioned'], noop);

gulp.task('version', ['getGitHash', 'getBuildNumber', 'setVersion'], noop);

gulp.task('build', ['clean','version', 'buildSolution'], noop);

gulp.task('test', ['build'], function(){
	console.log('test');
});

gulp.task('deploy', ['build','test'], function(){
	console.log('deploy');
			//'/p:OutputPath=D:\\JenkinsDrops\\WSB_All\\',
});

// default task gets called when you run `gulp` with no arguments
gulp.task('default', ['clean', 'version', 'build', 'test', 'deploy'], noop);
