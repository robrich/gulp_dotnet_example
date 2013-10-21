/*jshint node:true */

"use strict";

var es = require('event-stream'),
	setVersion = require('./setVersion');

module.exports = function(gitHash, fileVersion){
	// check our options
	if (!gitHash) {
		throw new Error("gitHash option missing");
	}

	return es.map(function (file, cb){
		var fileContents = String(file.contents);
		var newContents = setVersion(fileContents, gitHash, fileVersion);
		file.contents = new Buffer(newContents);
		cb(null, file);
	});
};
