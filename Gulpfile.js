/*jshint node:true */

"use strict";

var path = require('path');
var gulp = require('gulp');

var clean = require('./gulpLib/clean');
var version = require('./gulpLib/version');
var build = require('./gulpLib/build');
var test = require('./gulpLib/test');
var deploy = require('./gulpLib/deploy');


var opts = {
	solutionName: 'GulpTarget',
	platform: 'Any CPU',
	frameworkVersion: '4.0.30319', // MSBuild path
	frameworkName: 'net-4.5', // for NUnit
	msbuildVerbosity: 'Minimal',
	configuration: 'Release',
	debug: false,
	buildNumber: process.env.BUILD_NUMBER,
	copyrightHeader: 'Copyright {{year}} MyCompany, All Rights Reserved',
	verbose: true
};
opts.solutionFile = opts.solutionName+'.sln';
opts.headerText = '/*! {{copyrightHeader}}\r\n   Hash: {{gitHash}}\r\n   Branch: {{gitBranch}}\r\n   Build: {{buildNumber}}\r\n   Build date: {{now}} */';
opts.debugConditional = opts.debug ? 'DEBUG;TRACE' : '';
opts.outputPath = opts.debug ? 'bin/Debug' : 'bin/Release';
opts.doDeploy = !!opts.buildNumber; // FRAGILE: ASSUME: If we have a build number we're on the CI box
gulp.task('setDeployLocation', ['version'], function (cb) {
	opts.deployLocation = path.resolve('D:\\JenkinsDrops\\'+opts.getGitBranch+'\\'+opts.getGitHash+'_'+opts.buildNumber);
	cb(null);
});


opts.jshint = {
	"evil": false,
	"regexdash": false,
	"browser": false,
	"wsh": false,
	"trailing": false,
	"sub": false,
	"bitwise": true,
	"camelcase": true,
	"curly": true,
	"eqeqeq": true,
	"forin": true,
	"immed": true,
	"latedef": true,
	"newcap": true,
	"noarg": true,
	"noempty": true,
	"nonew": true,
	"regexp": true,
	"undef": true,
	"unused": true,
	"strict": true
};

gulp.on('err', function (e) {
	console.log();
	console.log('Gulp build failed: '+e.message);
	process.exit(1);
});


var noop = function () {};


// default task gets called when you run `gulp` with no arguments
gulp.task('default', ['clean', 'version', 'build', 'test', 'deploy'], noop);

// The main 5 steps:
gulp.task('clean', ['cleanVersioned', 'cleanUnversioned'], noop);
gulp.task('version', ['getGitHash', 'getGitBranch', 'setVersion'], noop);
gulp.task('build', ['clean','version', 'runCssMin', 'runUglify', 'buildSolution', 'postBuildProjects'], noop);
gulp.task('test', ['build', 'runJSHint', 'runJSTests', 'runCssLint', 'runNUnit'], noop);
gulp.task('deploy', ['build','test', 'copyToDeployLocation'], noop);

// clean

gulp.task('cleanUnversioned', ['setOpts'], clean.cleanUnversioned);
gulp.task('cleanVersioned', ['setOpts'], clean.cleanVersioned);

// version

gulp.task('getGitHash', ['setOpts', 'cleanVersioned'], version.getGitHash);
gulp.task('getGitBranch', ['setOpts', 'cleanVersioned'], version.getGitBranch);
gulp.task('setVersion', ['clean', 'getGitHash','getGitBranch'], version.setVersion);
// Helpful for developers who want to put it back, not directly referenced by the build
// `gulp revertVersion` from a cmd
gulp.task('revertVersion', version.revertVersion);

// build

gulp.task('runCssMin', ['clean','version', 'setOpts'], build.runCssMin);
gulp.task('runUglify', ['clean','version', 'setOpts'], build.runUglify);
gulp.task('buildSolution', ['clean','version', 'setOpts', 'runCssMin', 'runUglify'], build.buildSolution);
gulp.task('postBuildProjects', ['buildSolution','runCssMin','runUglify'], build.postBuildProjects);

// test

gulp.task('runJSHint', ['setOpts', 'clean'], test.runJSHint);
gulp.task('runCssLint', ['clean'], test.runCssLint);
gulp.task('runJSTests', ['setOpts', 'clean'], test.runJSTests);
gulp.task('runNUnit', ['build', 'setOpts'], test.runNUnit);

// deploy

gulp.task('copyToDeployLocation', ['setOpts', 'build', 'test', 'setDeployLocation'], deploy.copyToDeployLocation);

// generic

gulp.task('setOpts', function () {
	clean.setOpts(opts);
	version.setOpts(opts);
	build.setOpts(opts);
	test.setOpts(opts);
	deploy.setOpts(opts);
});
