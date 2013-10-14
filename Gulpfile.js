/*jshint node:true */

"use strict";

var gulp = require('gulp');

var clean = require('./gulpLib/clean');
var version = require('./gulpLib/version');
var build = require('./gulpLib/build');
var test = require('./gulpLib/test');
var deploy = require('./gulpLib/deploy');


var opts = {
	solutionName: 'GulpTarget',
	platform: 'Any CPU',
	frameworkVersion: '4.0.30319',
	frameworkName: 'net-4.0',
	msbuildVerbosity: 'Minimal',
	configuration: 'Release',
	// Release: debug: 'false', debugConditional : '',
	// Debug: debug: 'true', debugConditional : 'DEBUG;TRACE',
	debug: 'false',
	debugConditional: '',
	copyrightHeader: 'Copyright {{year}} MyCompany, All Rights Reserved'
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
gulp.task('test', ['build', 'testSetOpts', 'runJSHint', 'runCssLint', 'runNUnit'], noop);
gulp.task('deploy', ['build','test', 'deployToJenkinsDrops'], noop);

// clean

gulp.task('cleanUnversioned', clean.cleanUnversioned);
gulp.task('cleanVersioned', clean.cleanVersioned);

// version

gulp.task('getGitHash', ['setOpts'], version.getGitHash);
gulp.task('getBuildNumber', ['setOpts'], version.getBuildNumber);
gulp.task('setVersion', ['clean', 'getGitHash', 'getBuildNumber'], version.setVersion);
// Helpful for develpers who want to put it back, not directly referenced by the build
// `gulp revertVersion` from a cmd
gulp.task('revertVersion', version.revertVersion);

// build

gulp.task('runCssMin', ['setOpts'], build.runCssMin);
gulp.task('runUglify', ['setOpts'], build.runUglify);
gulp.task('buildSolution', ['clean','version', 'runCssMin', 'runUglify', 'setOpts'], build.buildSolution);
gulp.task('copySolutionProjects', ['buildSolution'], build.copySolutionProjects);

// test
gulp.task('testSetOpts', function () {
});
gulp.task('runJSHint', test.runJSHint);
gulp.task('runCssLint', test.runCssLint);
gulp.task('runNUnit', ['build', 'setOpts'], test.runNUnit);

// deploy
gulp.task('deployToJenkinsDrops', ['setOpts'], deploy.deployToJenkinsDrops);

// generic

gulp.task('setOpts', function () {
	version.setOpts(opts);
	build.setOpts(opts);
	test.setOpts(opts);
	deploy.setOpts(opts);
});
