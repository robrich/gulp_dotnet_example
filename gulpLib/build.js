/*jshint node:true */

"use strict";

var gulp = require('gulp');
var minifyCSS = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var ignore = require('./lib/gulp-ignore');
var verbose = require('./lib/gulp-verbose');
var header = require('gulp-header');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var mkdirp = require('mkdirp');
var ncp = require('ncp');
var async = require('async');
var parseSlnStream = require('./lib/parseSlnStream');

var opts;

var setOpts = function (o) {
	opts = o;
};


var setHeaderText = function () {
	opts.headerText = '/*! '+opts.copyrightHeader+'\r\n   Hash: '+opts.gitHash+'\r\n   Branch: '+opts.gitBranch+'\r\n   Build: '+(opts.buildNumber || '')+'\r\n   Build date: {{now}} */';
};

var runCssMin = function (cb) {
	setHeaderText(); // after version.getGitHash()
	var mess = opts.verbose ? 'minifying $file' : '';
	var stream = gulp.src('./Web/**/*.css')
		.pipe(ignore(['./**/m/**', './**/libs/**']))
		.pipe(verbose(mess))
		.pipe(minifyCSS({}))
		.pipe(header(opts.headerText))
		.pipe(gulp.dest('./Web/m/'+opts.gitHash+'/'));
	stream.once('end', cb);
};

var runUglify = function (cb) {
	setHeaderText(); // after version.getGitHash()
	var mess = opts.verbose ? 'uglifying $file' : '';
	var stream = gulp.src('./Web/**/*.js')
		.pipe(ignore(['./**/m/**', './**/libs/**', './**/_references.js']))
		.pipe(verbose(mess))
		.pipe(uglify())
		.pipe(header(opts.headerText))
		.pipe(gulp.dest('./Web/m/'+opts.gitHash+'/'));
	stream.once('end', cb);
};

var buildSolution = function(cb){
	fs.mkdir('log', function (err) {
		if (err && err.code === 'EEXIST') {
			err = null; // Ignore 'directory already exists' error
		}
		if (err) {
			throw new Error(err);
		}
		var cmds = [
			"C:\\Windows\\Microsoft.NET\\Framework\\v"+opts.frameworkVersion+"\\msbuild.exe",
			path.resolve(opts.solutionFile).replace('/','\\')
		];
		var args = [
			'/m',
			'/target:Clean,Rebuild',
			'/property:Configuration='+opts.configuration,
			'/verbosity:'+opts.msbuildVerbosity,
			'/p:DEBUG='+opts.debug,
			'/p:TRACE='+opts.debug,
			'/noconsolelogger',
			// implied: '/fileLogger',
			'/fileLoggerParameters:LogFile=log\\'+opts.solutionName+'.msbuild.log;Verbosity='+opts.msbuildVerbosity
		];
		if (opts.debugConditional) {
			args.push('/p:DefineConstants='+opts.debugConditional);
		}
		var cmd = '"'+cmds.concat(args).join('" "')+'"';
		if (opts.verbose) {
			console.log("buildSolution: "+cmd);
		}
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
				console.log('msbuild failed, exit code '+error.code);
			}
			cb(error);
		});
	});
};

// dest is folder
var packageProject = function (projPath, projName, destPackage, cb) {
	fs.mkdir('log', function (err) {
		if (err && err.code === 'EEXIST') {
			err = null; // Ignore 'directory already exists' error
		}
		if (err) {
			return cb(err);
		}

		// TODO: delete old /obj/*.config

		var destBackslash = path.resolve(destPackage).replace(/\//,'\\');

		var cmds = [
			"C:\\Windows\\Microsoft.NET\\Framework\\v"+opts.frameworkVersion+"\\msbuild.exe",
			path.resolve(projPath).replace('/','\\')
		];
		var args = [
			'/m',
			'/target:TransformWebConfig;Package',
			'/p:PackageLocation='+destBackslash,
			'/property:Configuration='+opts.configuration,
			'/verbosity:'+opts.msbuildVerbosity,
			'/p:DEBUG='+opts.debug,
			'/p:TRACE='+opts.debug,
			'/noconsolelogger',
			// implied: '/fileLogger',
			'/fileLoggerParameters:LogFile=log\\'+projName+'-packageProject.msbuild.log;Verbosity='+opts.msbuildVerbosity
		];
		if (opts.debugConditional) {
			args.push('/p:DefineConstants='+opts.debugConditional);
		}
		var cmd = '"'+cmds.concat(args).join('" "')+'"';
		if (opts.verbose) {
			console.log('packageProject: projName: '+projName+', projPath:'+projPath+', destPackage: '+destPackage);
			console.log(' cmd: '+cmd);
		}
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
				console.log('msbuild failed, exit code '+error.code);
				return cb(error);
			}
			if (!fs.existsSync(destPackage)) {
				return cb('Web Deploy package for '+projName+' not found at '+destPackage);
			}
			return cb(null);
		});
	});
};

var copyProject = function (projPath, projName, dest, cb) {
	fs.mkdir('log', function (err) {
		if (err && err.code === 'EEXIST') {
			err = null; // Ignore 'directory already exists' error
		}
		if (err) {
			return cb(err);
		}
		mkdirp(dest, function (err) {
			if (err && err.code === 'EEXIST') {
				err = null; // Ignore 'directory already exists' error
			}
			if (err) {
				return cb(err);
			}

			var destBackslash = path.resolve(dest).replace(/\//,'\\');

			// TODO: delete old /obj/*.config

			var cmds = [
				"C:\\Windows\\Microsoft.NET\\Framework\\v"+opts.frameworkVersion+"\\msbuild.exe",
				path.resolve(projPath).replace('/','\\')
			];
			var args = [
				'/m',
				'/target:PipelinePreDeployCopyAllFilesToOneFolder',
				'/p:_PackageTempDir='+destBackslash,
				'/property:Configuration='+opts.configuration,
				'/verbosity:'+opts.msbuildVerbosity,
				'/p:DEBUG='+opts.debug,
				'/p:TRACE='+opts.debug,
				'/noconsolelogger',
				// implied: '/fileLogger',
				'/fileLoggerParameters:LogFile=log\\'+projName+'-copyProject.msbuild.log;Verbosity='+opts.msbuildVerbosity
			];
			if (opts.debugConditional) {
				args.push('/p:DefineConstants='+opts.debugConditional);
			}
			var cmd = '"'+cmds.concat(args).join('" "')+'"';
			if (opts.verbose) {
				console.log('copyProject: projName: '+projName+', projPath:'+projPath+', dest: '+dest);
				console.log(' cmd: '+cmd);
			}
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
					console.log('msbuild failed, exit code '+error.code);
					return cb(error);
				}

				// MSBuild copies /bin/*.dll and transformed Web.config but doesn't copy other things in /bin/ like *.xml, *.pdb, etc

				var projDir = path.dirname(projPath);
				var copyDest = path.join(dest,'bin');

				if (opts.verbose) {
					console.log('copy '+path.join(projDir,'bin')+' to '+copyDest);
				}
				var stream = gulp.src(path.join(projDir,'bin','**'))
					.pipe(ignore(function (file) {
						var writePath = path.join(copyDest, file.shortened);
						return fs.existsSync(writePath);
					}))
					.pipe(gulp.dest(path.join(dest,'bin')));
				stream.on('end', cb);
			});
		});
	});
};

var copyProjectFolder = function (project, cb) {
	mkdirp(path.join('./dist', project.projectType, project.name), function (err) {
		if (err) {
			return cb(err);
		}
		ncp(path.join(project.base,opts.outputPath), path.join('./dist', project.projectType, project.name), cb);
	});
};

var postBuildProject = function (project, cb) {
	if (!project) {
		return cb(new Error("project is blank"));
	}
	switch (project.projectType) {
		case 'web':
			// FRAGILE: If two web projects do this simultaneously bad things may happen
			async.series([
				function (cbb) {
					packageProject(project.path, project.name, path.join('./dist', project.projectType, project.name+'.zip'), cbb);
				},
				function (cba) {
					copyProject(project.path, project.name, path.join('./dist', project.projectType, project.name), cba);
				}
			], cb);
			break;
		case 'app':
			copyProjectFolder(project, cb);
			break;
		case 'test':
			copyProjectFolder(project, cb);
			break;
		case 'db':
			copyProjectFolder(project, cb);
			break;
		case 'lib':
			cb(null); // Nothing to do
			break;
		default:
			return cb(new Error('Unknown projectType: '+project.projectType+', '+JSON.stringify(project)));
	}
};

var postBuildProjects = function (cb) {
	parseSlnStream(opts.solutionFile, function (err, projects) {
		if (err) {
			return cb(err);
		}
		if (!projects || !projects.length) {
			return cb(null); // successfully did nothing
		}
		if (opts.verbose) {
			var i, project;
			console.log(' Identified projects:');
			for (i = 0; i < projects.length; i++) {
				project = projects[i];
				console.log('  project: '+project.name+', type: '+project.projectType+', path: '+project.path);
			}
		}
		async.each(projects, postBuildProject, cb);
	});
};

module.exports = {
	setOpts: setOpts,
	runCssMin: runCssMin,
	runUglify: runUglify,
	buildSolution: buildSolution,
	copyProject: copyProject,
	packageProject: packageProject,
	postBuildProject: postBuildProject,
	postBuildProjects: postBuildProjects
};
