/*jshint node:true */

"use strict";

var gulp = require('gulp');
var jshint = require('gulp-jshint');
//var csslint = require('gulp-csslint');
var ignore = require('./lib/gulp-ignore');
var async = require('async');
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var verbose = require('./lib/gulp-verbose');


var opts;

var setOpts = function (o) {
	opts = o;
};

var runJSHint = function (cb) {
	// TODO: junit log at log/jshint.xml
	var mess = opts.verbose ? 'linting $file' : '';
	var stream = gulp.src('./**/*.js')
		.pipe(ignore(['./**/*.min.js','./dist/**','./**/libs/**']))
		.pipe(ignore(['./node_modules/**','./packages/**']))
		.pipe(verbose(mess))
		.pipe(jshint(opts.jshint));
	stream.once('end', cb);
};

/*
var runCssLint = function (cb) {
	var opts = {
		formatters: [
			{id: 'junit-xml', dest: 'log/csslint_junit.xml'},
			{id: 'compact', dest: 'log/csslint.log'}
		],
		// https://github.com/gruntjs/grunt-contrib-csslint
		// false means off, 2 means error, else warning
		'ids': false,
		'vendor-prefix': false,
		'box-model': false,
		'box-sizing': false,
		'duplicate-background-images': false,
		'star-property-hack': false,
		'universal-selector': false,
		'qualified-headings': false,
		'unique-headings': false, // fails to disambiguate qualified headings
		'import': 2,
		'empty-rules': 2,
		'important': 2,
		'zero-units': 2
		// TODO: Expand this as necessary
	};
	var stream = gulp.src(' . / * * / * . c s s ')
		.pipe(ignore([' * * / * . m i n . c s s ',' . / d i s t / * *',' * * / l i b s / * * '))
		.pipe(ignore([' n o d e _ m o d u l e s / * * ',' p a c k a g e s / * * ']))
		.pipe(csslint(opts));
	stream.once('end', cb);
};
*/
// TODO: run real process when gulp-csslint is done !!!
var runCssLint = function (cb) {
	cb(null);
};

var runNUnitForProject = function (projectPath, cb) {
	fs.mkdir('log', function (err) {
		if (err) {
			throw new Error(err);
		}

		var dllName = path.basename(projectPath)+'.dll';
		var fullPath = path.resolve(projectPath+'/'+dllName).replace(/\//,'\\');
		var logFile = path.resolve('log/'+dllName+'.nunit.xml').replace(/\//,'\\');

		var cmds = [
			"nunit-console-x86.exe"
		];
		var args = [
			'/nodots',
			'/xml:'+logFile,
			'/framework='+opts.frameworkName,
			'/config:'+fullPath+'.config',
			fullPath
		];
		var cmd = '"'+cmds.concat(args).join('" "')+'"';
		console.log('NUnit '+dllName+': '+cmd);
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
				console.log('NUnit '+dllName+' failed, exit code '+error.code);
			}
			cb(error);
		});
	});
};

var runNUnit = function (cb) {
	fs.readdir('./dist/Test/', function (err, projects) {
		if (err) {
			return cb(err);
		}

		async.each(
			projects,
			runNUnitForProject,
			function (err) {
				cb(err);
			}
		);
	});
};

module.exports = {
	runJSHint: runJSHint,
	runCssLint: runCssLint,
	runNUnit: runNUnit,
	runNUnitForProject: runNUnitForProject,
	setOpts: setOpts
};
