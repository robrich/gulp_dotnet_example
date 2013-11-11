/*jshint node:true */

"use strict";

var mkdirp = require('mkdirp');
var ncp = require('ncp');


var opts;

var setOpts = function (o) {
	opts = o;
};

var copyToDeployLocation = function (cb) {
	if (opts.doDeploy) {
		console.log('deploying web assets to '+opts.deployLocation);
		mkdirp(opts.deployLocation, function (err) {
			if (err) {
				return cb(err);
			}
			ncp('./dist/Web/Web', opts.deployLocation, cb);
		});
	}
};

module.exports = {
	copyToDeployLocation: copyToDeployLocation,
	setOpts: setOpts
};
