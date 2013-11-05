/*jshint node:true */

"use strict";

var ncp = require('ncp');


var opts;

var setOpts = function (o) {
	opts = o;
};

var copyToDeployLocation = function (cb) {
	ncp('./dist/Web/Web', opts.deployLocation, cb);
};

module.exports = {
	copyToDeployLocation: copyToDeployLocation,
	setOpts: setOpts
};
