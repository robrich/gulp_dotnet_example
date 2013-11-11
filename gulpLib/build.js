/*jshint node:true */

"use strict";

var gulp = require('gulp');
var minifyCSS = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var ignore = require('./lib/gulp-ignore');
var verbose = require('./lib/gulp-verbose');
var header = require('gulp-header');
var chalk = require('chalk');
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


var runCssMin = function (cb) {
	var mess = opts.verbose ? 'minifying $file' : '';
	var stream = gulp.src('./Web/**/*.css')
		.pipe(ignore(['./**/m/**', './**/libs/**']))
		.pipe(verbose(mess))
		.pipe(minifyCSS({}))
		.pipe(header(opts.headerText, opts))
		.pipe(gulp.dest('./Web/m/'+opts.gitHash+'/'));
	stream.once('end', cb);
};

var runUglify = function (cb) {
	var mess = opts.verbose ? 'uglifying $file' : '';
	var stream = gulp.src('./Web/**/*.js')
		.pipe(ignore(['./**/m/**', './**/libs/**', './**/_references.js']))
		.pipe(verbose(mess))
		.pipe(uglify())
		.pipe(header(opts.headerText, opts))
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
			'/nologo',
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
			console.log(chalk.green('buildSolution')+': '+cmd);
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
				console.log(chalk.red('solution build failed')+', exit code '+error.code);
			}
			cb(error);
		});
	});
};

// dest is folder
var packageProject = function (project, cb) {
	fs.mkdir('log', function (err) {
		if (err && err.code === 'EEXIST') {
			err = null; // Ignore 'directory already exists' error
		}
		if (err) {
			return cb(err);
		}

		var projPath = project.path;
		var projName = project.name;
		var destPackage = path.join('./dist', project.projectType, project.name+'-pkg', project.name+'.zip');

		// TODO: delete old /obj/*.config

		var destBackslash = path.resolve(destPackage).replace(/\//,'\\');

		var cmds = [
			"C:\\Windows\\Microsoft.NET\\Framework\\v"+opts.frameworkVersion+"\\msbuild.exe",
			path.resolve(projPath).replace('/','\\')
		];
		var args = [
			'/m',
			'/nologo',
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
			console.log(chalk.green('packageProject')+': projName: '+chalk.cyan(projName)+', projPath:'+projPath+', destPackage: '+destPackage);
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
				console.log(chalk.red('packageProject:'+projName+' failed')+', exit code '+error.code);
				return cb(error);
			}
			if (!fs.existsSync(destPackage)) {
				return cb('Web Deploy package for '+projName+' not found at '+destPackage);
			}
			return cb(null);
		});
	});
};

var copyProject = function (project, cb) {
	fs.mkdir('log', function (err) {
		if (err && err.code === 'EEXIST') {
			err = null; // Ignore 'directory already exists' error
		}
		if (err) {
			return cb(err);
		}

		var projPath = project.path;
		var projName = project.name;
		var dest = path.join('./dist', project.projectType, project.name);

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
				'/nologo',
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
				console.log(chalk.green('copyProject')+': projName: '+chalk.cyan(projName)+', projPath:'+projPath+', dest: '+dest);
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
					console.log(chalk.red('copyProject:'+projName+' failed')+', exit code '+error.code);
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
	var copyDest = path.join('./dist', project.projectType, project.name);
	mkdirp(copyDest, function (err) {
		if (err) {
			return cb(err);
		}
		if (opts.verbose) {
			console.log(chalk.green('copyProjectFolder')+': projName: '+chalk.cyan(project.name)+', dest: '+copyDest);
		}
		ncp(path.join(project.base,opts.outputPath), copyDest, cb);
	});
};

var postBuildProjects = function (cb) {
	parseSlnStream(opts.solutionFile, function (err, projects) {
		var i = 0, parallel = [], series = [], packageProjectClosure, copyProjectClosure, copyProjectFolderClosure, project;
		if (err) {
			return cb(err);
		}
		if (!projects || !projects.length) {
			return cb(null); // successfully did nothing
		}
		if (opts.verbose) {
			console.log(' Identified projects:');
			for (i = 0; i < projects.length; i++) {
				project = projects[i];
				console.log('  project: '+project.name+', type: '+project.projectType+', path: '+project.path);
			}
			console.log('');
		}

		// closures to capture the project from the loop
		packageProjectClosure = function (p) {
			return function (cbc) {
				packageProject(p, cbc);
			};
		};
		copyProjectClosure = function (p) {
			return function (cbc) {
				copyProject(p, cbc);
			};
		};
		copyProjectFolderClosure = function (p) {
			return function (cbc) {
				copyProjectFolder(p, cbc);
			};
		};

		// schedule tasks for each project based on project type
		for (i = 0; i < projects.length; i++) {
			project = projects[i];
			switch (project.projectType) {
				case 'web':
					series.push(copyProjectClosure(project));
					series.push(packageProjectClosure(project));
					break;
				case 'app':
					parallel.push(copyProjectFolderClosure(project));
					break;
				case 'test':
					parallel.push(copyProjectFolderClosure(project));
					break;
				case 'db':
					parallel.push(copyProjectFolderClosure(project));
					break;
				case 'lib':
					// Nothing to do
					break;
				default:
					return cb(new Error('Unknown projectType: '+project.projectType+', '+JSON.stringify(project)));
			}
		}

		// add series tasks to the parallel loop
		parallel.push(function (cba) {
			async.series(series, cba);
		});

		// run the tasks
		async.parallel(parallel, cb);
	});
};

module.exports = {
	setOpts: setOpts,
	runCssMin: runCssMin,
	runUglify: runUglify,
	buildSolution: buildSolution,
	copyProject: copyProject,
	packageProject: packageProject,
	postBuildProjects: postBuildProjects
};
