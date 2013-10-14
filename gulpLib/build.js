/*jshint node:true */

"use strict";

var fs = require('fs');
var exec = require('child_process').exec;

var buildSolution = function(opts, callback){
	fs.mkdir('log', function (err) {
		if (err) {
			throw new Error(err);
		}
		var cmds = [
			"C:\\Windows\\Microsoft.NET\\Framework\\v"+opts.frameworkVersion+"\\msbuild.exe",
			opts.solutionFile.replace('/','\\')
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
				throw new Error('msbuild failed, exit code '+error.code);
			}
			callback(error);
		});
	});
};

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
