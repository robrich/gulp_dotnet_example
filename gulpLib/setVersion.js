/*jshint node:true */

"use strict";
module.exports = function(content, gitHash, productVersion){
	// check our options
	if (!gitHash) {
		throw new Error('missing content or version');
	}

	var newContent = content;
	if (newContent) {
		// [assembly: AssemblyDescription("")] -> [assembly: AssemblyDescription("gitHash")]
		newContent = newContent.replace(/(AssemblyDescription\( *\")[^\"]*(\" *\))/g,'$1'+gitHash+'$2');
	}
	if (newContent && productVersion) {
		// [assembly: Assembly*Version("1.0.*")] -> [assembly: Assembly*Version("1.0.705.246")]
		newContent = newContent.replace(/(Assembly[a-zA-Z]*Version\( *\"[0-9]+\.[0-9]+\.)[^\"]*(\" *\))/g,'$1'+productVersion+'$2');
	}

	return newContent;
};
