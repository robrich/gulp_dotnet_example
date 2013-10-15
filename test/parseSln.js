/*jshint node:true */
/*global describe:false, it:false */

"use strict";

var parseSln = require('../gulpLib/lib/parseSln');
var fs = require('fs');
var should = require('should');
require('mocha');

describe('parseSln', function() {
	describe('slnLineToJson()', function () {
		it('should find three project lines', function(done) {
			// Arrange
			var slnLine = 'Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Tests", "Tests\\Tests.csproj", "{591C349E-E5FC-4559-AD8C-EEDD46BE9480}"';
			var expected = {
				name: 'Tests',
				path: 'Tests\\Tests.csproj',
				guid: '591C349E-E5FC-4559-AD8C-EEDD46BE9480'
			};
			// Act
			var actual = parseSln.slnLineToJson(slnLine);
			// Assert
			should.deepEqual(actual, expected);
			done();
		});
		it('should find no project lines', function(done) {
			// Arrange
			var slnLine = 'EndProject';
			var expected;
			// Act
			var actual = parseSln.slnLineToJson(slnLine);
			// Assert
			should.deepEqual(actual, expected);
			done();
		});
	});

	describe('getProjectTypes()', function () {
		it('should find project types in line', function(done) {
			// Arrange
			var i;
			var projLine = "<ProjectTypeGuids>{E3E379DF-F4C6-4180-9B81-6769533ABE47};{349c5851-65df-11da-9384-00065b846f21};{fae04ec0-301f-11d3-bf4b-00c04f79efbc}</ProjectTypeGuids>";
			var expected = [
				'E3E379DF-F4C6-4180-9B81-6769533ABE47',
				'349c5851-65df-11da-9384-00065b846f21',
				'fae04ec0-301f-11d3-bf4b-00c04f79efbc'
			];
			// Act
			var actual = parseSln.getProjectTypes(projLine);
			// Assert
			// Apparently deep equal doesn't check arrays
			actual.length.should.equal(expected.length);
			for (i = 0; i < actual.length; i++) {
				expected[i].should.equal(actual[i]);
			}
			done();
		});
		it('should find no project types on blank line', function(done) {
			// Arrange
			var projLine = "<ProjectTypeGuids></ProjectTypeGuids>";
			var expected;
			// Act
			var actual = parseSln.getProjectTypes(projLine);
			// Assert
			should.deepEqual(actual, expected);
			done();
		});
		it('should find no project types on other line', function(done) {
			// Arrange
			var projLine = "<OtherLine>{E3E379DF-F4C6-4180-9B81-6769533ABE47}</OtherLine>";
			var expected;
			// Act
			var actual = parseSln.getProjectTypes(projLine);
			// Assert
			should.deepEqual(actual, expected);
			done();
		});
	});

	describe('getFile()', function () {
		it('should read file content', function(done) {
			// Arrange
			var fileName = './test/data/temp.txt';
			var fileContent = 'This is a test file that can safely be deleted';
			fs.writeFile(fileName, fileContent, function (err) {
				should.not.exist(err);
				// Act
				parseSln.getFile(fileName, function (err2, actual) {
					// Assert
					should.not.exist(err2);
					fileContent.should.equal(actual);
					done();
				});
			});
		});
		it('should not error on missing file', function(done) {
			// Arrange
			var fileName = './test/data/non-existing-file.txt';
			var fileContent = null;
			fs.existsSync(fileName).should.equal(false);
			// Act
			parseSln.getFile(fileName, function (err2, actual) {
				// Assert
				should.not.exist(err2);
				should.equal(actual, fileContent);
				done();
			});
		});
	});
});
