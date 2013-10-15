/*jshint node:true */

"use strict";
module.exports = function(content, gitHash, productVersion){
	// check our options
	if (!gitHash) {
		throw new Error('missing content or version');
	}

	var newContent = content;
	if (newContent && productVersion) {
		var revision = Math.floor(productVersion/65535);
		var build = productVersion % 65535;
		// [assembly: Assembly*Version("1.0.*")] -> [assembly: Assembly*Version("1.0.705.246")]
		newContent = newContent.replace(/(Assembly[a-zA-Z]*Version\( *\"[0-9]+\.[0-9]+\.)[^\"]*(\" *\))/g,'$1'+revision+'.'+build+'$2');
	}
	if (newContent) {
		// [assembly: AssemblyInformationalVersion("")] -> [assembly: AssemblyDescription("gitHash")]
		newContent = newContent.replace(/(AssemblyInformationalVersion\( *\")[^\"]*(\" *\))/g,'$1'+gitHash+'$2');
	}

	return newContent;
};
