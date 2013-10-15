/*jshint node:true */
/*global describe:false, it:false */

"use strict";

var parseSlnStream = require('../gulpLib/lib/parseSlnStream');
var should = require('should');
require('mocha');

describe('parseSlnStream', function() {
	describe('parseSolutionPipeline()', function () {
		it('should find three projects and correctly identify them', function(done) {
			// Arrange
			var slnFile = './test/data/Solution.sln';
			var expectedWeb = {
				name: 'Web',
				path: 'test\\data\\Web\\Web.csproj',
				base: 'test\\data\\Web',
				guid: 'CD3CC917-0DDD-41A1-8701-C786082EDE1E',
				isWebProject: true,
				isAppProject: false,
				isDatabaseProject: false,
				isTestProject: false,
				projectType: 'web'
			};
			var expectedLib = {
				name: 'Lib',
				path: 'test\\data\\Lib\\Lib.csproj',
				base: 'test\\data\\Lib',
				guid: '04C48827-FE92-42F5-8F33-FFA6794E3C42',
				isWebProject: false,
				isAppProject: false,
				isDatabaseProject: false,
				isTestProject: false,
				projectType: 'lib'
			};
			var expectedTests = {
				name: 'Tests',
				path: 'test\\data\\Tests\\Tests.csproj',
				base: 'test\\data\\Tests',
				guid: '591C349E-E5FC-4559-AD8C-EEDD46BE9480',
				isWebProject: false,
				isAppProject: false,
				isDatabaseProject: false,
				isTestProject: true,
				projectType: 'test'
			};
			var i, step;
			// Act
			parseSlnStream(slnFile, function (err, actual) {
				// Assert
				should.not.exist(err);
				should.exist(actual);
				actual.length.should.equal(3);
				for (i = 0; i < actual.length; i++) {
					// Actual order is not deterministic
					step = actual[i];
					should.exist(step);
					switch (step.name) {
						case 'Web':
							should.deepEqual(step, expectedWeb);
							break;
						case 'Lib':
							should.deepEqual(step, expectedLib);
							break;
						case 'Tests':
							should.deepEqual(step, expectedTests);
							break;
						default:
							should.fail(step,actual, 'Unknown result: '+step.name);
							break;
					}
				}
				done();
			});
		});
	});
});
