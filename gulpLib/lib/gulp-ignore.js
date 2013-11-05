/*jshint node:true */

"use strict";

var es = require('event-stream'),
	minimatch = require('minimatch');

// pattern is a minimatch pattern or a function that returns bool: skip it?
module.exports = function(pattern){
	if (typeof pattern === 'string') {
		pattern = [pattern];
	}

	return es.map(function (file, cb){
		var i, skip = false;
		if (typeof pattern === 'function') {
			skip = pattern(file);
		} else {
			for (i = 0; i < pattern.length; i++) {
				if (minimatch(file.path, pattern[i])) {
					skip = true;
					break;
				}
			}
		}
		if (skip) {
			return cb(); // Ignore this one
		} else {
			return cb(null, file);
		}
	});
};
