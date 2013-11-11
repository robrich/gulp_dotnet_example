/*jshint node:true */

"use strict";

var es = require('event-stream'),
	fs = require('fs'),
	path = require('path'),
	parseSln = require('./parseSln');


var parseSolutionPipeline = function (slnFile, callback) {
	if (!callback) {
		throw new Error("callback is not defined");
	}
	parseSln.getFile(slnFile, function (err, data) {
		if (err) {
			return callback(err);
		}
		if (!data) {
			return callback(null, null); // Solution file doesn't exist or is blank
		}

		var slnBase = path.dirname(slnFile);
		var projects = [];

		var startStream = es.map(function (line, cb) {
			// get project json
			var json = parseSln.slnLineToJson(line);
			if (!json) {
				return cb(null); // Drop this line from the stream
			}
			cb(null, json);
		});
		var slnPipeline = startStream
			.pipe(es.map(function (proj, cb) {
				// resolve project path relative to sln path
				proj.path = path.join(slnBase, proj.path);
				proj.base = path.dirname(proj.path);
				cb(null, proj);
			}))
			.pipe(es.map(function (proj, cb) {
				// get project details from csproj file
				if (!fs.existsSync(proj.path)) {
					return cb(null); // Project file is missing, drop project from the stream
				}
				fs.stat(proj.path, function (err, stats) {
					if (err) {
						return cb(err);
					}
					if (stats.isDirectory()) {
						return cb(null); // Project file is a directory, drop project from stream
					}
					parseSln.getFile(proj.path, function (err, data) {
						if (err) {
							return cb(err,null);
						}
						parseSln.getProjectData(proj, data);
						cb(null, proj);
					});
				});
			}))
			.pipe(es.map(function (proj, cb) {
				// classify project type
				parseSln.classifyProject(proj);
				cb(null, proj);
			}))
			.pipe(es.map(function (proj, cb) {
				// collect results
				// TODO: find a better way to do this
				projects.push(proj);
				cb(null, proj);
			}));

		// We're done, return the results
		slnPipeline.once('end', function () {
			callback(err, projects);
		});

		// Start it off by writing the sln file to the stream
		var lines = data.split(/\r?\n/), i;
		for (i = 0; i < lines.length; i++) {
			startStream.write(lines[i]);
		}
		startStream.end();
	});
};

module.exports = parseSolutionPipeline;
