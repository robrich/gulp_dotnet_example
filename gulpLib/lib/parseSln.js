/*jshint node:true */

"use strict";

var fs = require('fs'),
	path = require('path');


var projRegex = /Project\(\"{([0-9A-F\-]+)}\"\) = \"([^\"]+)\", \"([^\"]+)\", \"{([^\"]+)}\"/;
// 0 is whole line
// 1 is language guid (C#, C++, VB, Database, etc)
// 2 is project name
// 3 is project path
// 4 is project guid

var slnLineToJson = function (line){
	var json;

	projRegex.lastIndex = 0;
	var match = projRegex.exec(line);
	if (match && match.length) {
		json = {
			name: match[2],
			path: match[3],
			guid: match[4]
		};
	}

	return json;
};

var getFile = function (filename, cb) {
	filename = path.resolve(filename);
	// .exists() doesn't return err, does .existsSync() throw?
	if (fs.existsSync(filename)) {
		fs.readFile(filename, 'utf8', cb);
	} else {
		cb(null, null);
	}
};

var projLineRegex = /<ProjectTypeGuids>([0-9A-Fa-f\-{};]+)<\/ProjectTypeGuids>/g;
var projTypeRegex = /{([0-9A-Fa-f\-]+)}/g;

var getProjectTypes = function (fileData) {
	projLineRegex.lastIndex = 0;
	var line = projLineRegex.exec(fileData), projs, i, p, m, results = [];
	if (line && line.length > 1) {
		projs = line[1].split(';');
		for (i = 0; i < projs.length; i++) {
			p = projs[i];
			projTypeRegex.lastIndex = 0;
			m = projTypeRegex.exec(p);
			if (m && m.length > 1) {
				results.push(m[1]);
			//} else {
				// invalid guid
			}
		}
	}
	return results.length > 0 ? results : undefined;
};

var isWebProject = function (fileData) {
	return fileData && (
		/<Content Include\="Web.config"/i.test(fileData) ||
		/{349c5851\-65df\-11da\-9384\-00065b846f21}/i.test(fileData)
	);
};

var isAppProject = function (fileData) {
	return fileData && (
		/<OutputType>Exe<\/OutputType>/i.test(fileData) ||
		/<OutputType>WinExe<\/OutputType>/i.test(fileData)
	);
};

var isDatabaseProject = function (fileData) {
	return fileData && (
		/Microsoft\.Data\.Schema\.SqlTasks\.targets/i.test(fileData)
	);
};

var isTestProject = function (fileData) {
	var result = false;

	if (fileData) {
		if (fileData.indexOf('nunit.framework.dll') > -1) {
			result = true;
		}
		if (fileData.indexOf('Microsoft.TestTools') > -1) {
			result = true;
		}
		if (fileData.indexOf('Microsoft.VisualStudio.TestTools') > -1) {
			result = true;
		}
		// TODO: expand this list as we get more testing frameworks
	}

	return result;
};

var getProjectData = function (proj, fileData) {
	if (proj && fileData) {
		proj.isWebProject = isWebProject(fileData);
		proj.isAppProject = isAppProject(fileData);
		proj.isDatabaseProject = isDatabaseProject(fileData);
		proj.isTestProject = isTestProject(fileData);
	}
};

var classifyProject = function (proj) {
	if (proj.isTestProject) {
		proj.projectType = 'test';
	} else if (proj.isDatabaseProject) {
		proj.projectType = 'db';
	} else if (proj.isAppProject) {
		proj.projectType = 'app';
	} else if (proj.isWebProject) {
		proj.projectType = 'web';
	} else {
		proj.projectType = 'lib';
	}
};

module.exports = {
	getFile: getFile,
	slnLineToJson: slnLineToJson,
	getProjectTypes: getProjectTypes,
	isTestProject: isTestProject,
	isWebProject: isWebProject,
	getProjectData: getProjectData,
	classifyProject: classifyProject
};
