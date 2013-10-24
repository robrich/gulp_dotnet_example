/*jshint node:true */

"use strict";

var gulp = require('gulp');
var minifyCSS = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var ignore = require('./lib/gulp-ignore');
var header = require('gulp-header');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var fsExtra = require('fs.extra');
var async = require('async');
var parseSlnStream = require('./lib/parseSlnStream');

var opts;

var setOpts = function (o) {
	opts = o;
};


var runCssMin = function (cb) {
	var headerText = '/*! '+opts.copyrightHeader+'\r\nHash: '+opts.gitHash+', Build: '+opts.buildNumber+' {{now}} */';
	var stream = gulp.src('./Web/**/*.css')
		.pipe(ignore(['**/m/**', '**/libs/**']))
		.pipe(minifyCSS({}))
		.pipe(header(headerText))
		.pipe(gulp.dest('./Web/m/'+opts.gitHash+'/'));
	stream.once('end', cb);
};

var runUglify = function (cb) {
	var headerText = '/*! '+opts.copyrightHeader+'\r\nHash: '+opts.gitHash+', Build: '+opts.buildNumber+' {{now}} */';
	var stream = gulp.src('./Web/**/*.js')
		.pipe(ignore(['**/m/**', '**/libs/**']))
		.pipe(uglify())
		.pipe(header(headerText))
		.pipe(gulp.dest('./Web/m/'+opts.gitHash+'/'));
	stream.once('end', cb);
};

var buildSolution = function(cb){
	fs.mkdir('log', function (err) {
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
			'/p:DefineConstants="'+opts.debugConditional+'"',
			'/p:debug='+opts.debug,
			'/p:trace='+opts.debug,
			//'/noconsolelogger',
			'/fileLogger',
			'/fileloggerparameters:logfile=log\\'+opts.solutionName+'.msbuild.log'
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
				console.log('msbuild failed, exit code '+error.code);
			}
			cb(error);
		});
	});
};

// dest is folder
var packageProject = function (projPath, projName, dest, cb) {
	fs.mkdir('log', function (err) {
		if (err) {
			return cb(err);
		}
		fs.mkdir(dest, function (err) {
			if (err) {
				return cb(err);
			}

			// TODO: delete old /obj/*.config

			var destPackage = path.join(dest, projName+'.zip');
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
				'/p:DefineConstants="'+opts.debugConditional+'"',
				'/p:debug='+opts.debug,
				'/p:trace='+opts.debug,
				//'/noconsolelogger',
				'/fileLogger',
				'/fileloggerparameters:logfile=log\\'+projName+'-copyProject.msbuild.log'
			];
			var cmd = '"'+cmds.concat(args).join('" "')+'"';
			console.log('copyProject: projName: '+projName+', projPath:'+projPath+', dest: '+dest+', cmd: '+cmd);
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
					cb('Web Deploy package for '+projName+' not found at '+destPackage);
				}
				return cb(null);
			});
		});
	});
};

var copyProject = function (projPath, projName, dest, cb) {
	fs.mkdir('log', function (err) {
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
			'/p:DefineConstants="'+opts.debugConditional+'"',
			'/p:debug='+opts.debug,
			'/p:trace='+opts.debug,
			//'/noconsolelogger',
			'/fileLogger',
			'/fileloggerparameters:logfile=log\\'+projName+'-copyProject.msbuild.log'
		];
		var cmd = '"'+cmds.concat(args).join('" "')+'"';
		console.log('copyProject: projName: '+projName+', projPath:'+projPath+', dest: '+dest+', cmd: '+cmd);
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

			async.parallel([
				function (cba) {
					// copy bin content
					fsExtra.copyRecursive(projPath+'/bin', dest+'/bin', function (err) {
						cba(err);
					});
				},
				function (cbb) {
					// copy transformed web.config (if any)
					var exists = fs.existsSync(projPath+'/obj/'+opts.configuration+'/TransformWebConfig/transformed/Web.config'); // async doesn't pass error, will sync throw it?
					if (exists) {
						fsExtra.copy(projPath+'/obj/'+opts.configuration+'/TransformWebConfig/transformed/Web.config', function (err) {
							cbb(err);
						});
					} else {
						// TODO: fail the build on missing transormed/Web.config?
						cbb(null);
					}
				}
			], cb);
		});
	});
};

var postBuildWebProject = function (project, cb) {
	// FRAGILE: If two web projects do this simultaneously bad things may happen
	async.series([
		function (cba) {
			copyProject(project.path, project.name, path.join('dist/Web',project.name), cba);
		},
		function (cbb) {
			packageProject(project.path, project.name, path.join('dist/Web',project.name), cbb);
		}
	], cb);
};
var postBuildAppProject = function (project, cb) {
	fsExtra.copyRecursive(path.join(project.base,opts.outputPath), path.join('dist/App',project.name), cb);
};
var postBuildTestProject = function (project, cb) {
	fsExtra.copyRecursive(path.join(project.base,opts.outputPath), path.join('dist/Test',project.name), cb);
};
var postBuildDbProject = function (project, cb) {
	fsExtra.copyRecursive(path.join(project.base,opts.outputPath), path.join('dist/Database',project.name), cb);
};
var postBuildLibProject = function (project, cb) {
	// Nothing to do
	cb(null);
};

var postBuildProject = function (project, cb) {
	if (!project) {
		return cb(new Error("project is blank"));
	}
	switch (project.projectType) {
		case 'web':
			postBuildWebProject(project, cb);
			break;
		case 'app':
			postBuildAppProject(project, cb);
			break;
		case 'test':
			postBuildTestProject(project, cb);
			break;
		case 'db':
			postBuildDbProject(project, cb);
			break;
		case 'lib':
			postBuildLibProject(project, cb);
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
