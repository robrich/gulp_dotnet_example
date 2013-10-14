/*jshint node:true */

"use strict";

var fsExtra = require('fs.extra');


var opts;

var setOpts = function (o) {
	opts = o;
};

var deployToJenkinsDrops = function (cb) {
	fsExtra.copyRecursive('./dist/Web/Web', 'D:\\JenkinsDrops\\WSB_All', function (err) {
		cb(err);
	});
};

module.exports = {
	deployToJenkinsDrops: deployToJenkinsDrops,
	setOpts: setOpts
};
