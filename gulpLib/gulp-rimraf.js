/*jshint node:true */

"use strict";

var es = require('event-stream');
var rimraf = require('rimraf');

module.exports = function(){
	return es.map(function (file, cb){
		console.log(file);
		cb(null, file);
	});
};
