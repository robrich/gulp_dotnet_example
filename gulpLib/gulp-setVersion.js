/*jshint node:true */

"use strict";

var es = require('event-stream'),
	clone = require('clone'),
	setVersion = require('./setVersion');

module.exports = function(gitHash, fileVersion){
	// check our options
	if (!gitHash) {
		throw new Error("gitHash option missing");
	}

	// our map function
	function modifyContents(file, cb){
		var newFile = clone(file);

		var fileContents = String(file.contents);

		var newContents = setVersion(fileContents, gitHash, fileVersion);

		newFile.contents = new Buffer(newContents);
		cb(null, newFile);
	}

	return es.map(modifyContents);
};
