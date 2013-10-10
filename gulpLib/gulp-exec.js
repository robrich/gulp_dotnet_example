/*jshint node:true */

"use strict";

var es = require('event-stream'),
	exec = require('child_process').exec;

module.exports = function(command){
	if (!command) {
		throw new Error('command is blank');
	}
	return es.map(function (file, cb){
		var cmd = command.replace(/\$file/, file.path);
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
			cb(error, file);
		});
	});
};
