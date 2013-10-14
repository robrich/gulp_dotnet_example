/*jshint node:true */

"use strict";

var gulp = require('gulp');

var clean = require('./gulpLib/clean');
var version = require('./gulpLib/version');
var build = require('./gulpLib/bulid');
var test = require('./gulpLib/test');
var deploy = require('./gulpLib/deploy');


var opts = {
	solutionName : 'GulpTarget',
	platform : 'Any CPU',
	frameworkVersion : '4.0.30319',
	msbuildVerbosity : 'Minimal',
	configuration : 'Release',
	// Release: debug : 'false', debugConditional : '',
	// Debug: debug : 'true', debugConditional : 'DEBUG;TRACE',
	debug : 'false',
	debugConditional : ''
};
opts.solutionFile = opts.solutionName+'.sln';
gulp.verbose = true; // show start and end for each task


var noop = function () {};


// default task gets called when you run `gulp` with no arguments
gulp.task('default', ['clean', 'version', 'build', 'test', 'deploy'], noop);

// The main 5 steps:
gulp.task('clean', ['cleanVersioned', 'cleanUnversioned'], noop);
gulp.task('version', ['getGitHash', 'getBuildNumber', 'setVersion'], noop);
gulp.task('build', ['clean','version', 'buildSolution', 'copySolutionProjects'], noop);
gulp.task('test', ['build'], function(){
	console.log('test');
});
gulp.task('deploy', ['build','test'], function(){
	console.log('deploy');
	//'/p:OutputPath=D:\\JenkinsDrops\\WSB_All\\',
});

// clean

gulp.task('cleanUnversioned', clean.cleanUnversioned);
gulp.task('cleanVersioned', clean.cleanVersioned);

// version

gulp.task('getGitHash', version.getGitHash);
gulp.task('getBuildNumber', version.getBuildNumber);
gulp.task('setVersion', ['clean', 'getGitHash', 'getBuildNumber'], version.setVersion);
// Helpful for develpers who want to put it back, not directly referenced by the build
// `gulp revertVersion` from a cmd
gulp.task('revertVersion', version.revertVersion);

// build

gulp.task('setOpts', function () {
	build.setOpts(opts);
});
// JSHint, csslint, minify, etc !!!!!!!!!!!
gulp.task('buildSolution', ['clean','version', 'setOpts'], build.buildSolution);
gulp.task('copySolutionProjects', ['buildSolution'], build.copySolutionProjects);

// test

// deploy
