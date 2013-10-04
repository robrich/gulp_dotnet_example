/*jshint node:true */
/*global describe:false, it:false, beforeEach:false, afterEach:false */

"use strict";

var setVersion = require('../gulpLib/setVersion');
require('should');
require('mocha');

describe('setVersion', function() {

  var theTest = function (content, gitHash, productVersion, expected) {
    var actual = setVersion(content, gitHash, productVersion);
    expected.should.equal(actual);
  };


  it('should set AssemblyDescription', function() {
    theTest(
      '[assembly: AssemblyDescription("")]',
      'abc',
      undefined,
      '[assembly: AssemblyDescription("abc")]'
    );
  });
  it('should set AssemblyDescription with spaces', function() {
    theTest(
      '[assembly:AssemblyDescription( "" )]',
      'abc',
      undefined,
      '[assembly:AssemblyDescription( "abc" )]'
    );
  });
  it('should override AssemblyDescription', function() {
    theTest(
      '[assembly: AssemblyDescription("notit")]',
      'abc',
      undefined,
      '[assembly: AssemblyDescription("abc")]'
    );
  });

  it('should set AssemblyVersion', function() {
    theTest(
      '[assembly: AssemblyVersion("1.0.0.0")]',
      'abc',
      '47',
      '[assembly: AssemblyVersion("1.0.47")]'
    );
  });
  it('should set AssemblyVersion from star', function() {
    theTest(
      '[assembly: AssemblyVersion("1.0.*")]',
      'abc',
      '47',
      '[assembly: AssemblyVersion("1.0.47")]'
    );
  });
  it('should set AssemblyVersion with spaces', function() {
    theTest(
      '[assembly: AssemblyVersion( "1.0.0.0" )]',
      'abc',
      '47',
      '[assembly: AssemblyVersion( "1.0.47" )]'
    );
  });
  it('should override AssemblyVersion', function() {
    theTest(
      '[assembly: AssemblyVersion("1.0.notit")]',
      'abc',
      '47',
      '[assembly: AssemblyVersion("1.0.47")]'
    );
  });
  it('should not set AssemblyVersion if no version passed', function() {
    theTest(
      '[assembly: AssemblyVersion("1.0.0.0")]',
      'abc',
      undefined,
      '[assembly: AssemblyVersion("1.0.0.0")]'
    );
  });

  it('should set AssemblyFileVersion', function() {
    theTest(
      '[assembly: AssemblyFileVersion("1.0.0.0")]',
      'abc',
      '47',
      '[assembly: AssemblyFileVersion("1.0.47")]'
    );
  });

  it('should set all of them', function() {
    theTest(
      '\n[assembly: AssemblyDescription("")]\n[assembly: AssemblyDescription("")]\n[assembly: AssemblyVersion("1.0.*")]\n[assembly: AssemblyFileVersion("1.0.*")]\n',
      'abc',
      '47',
      '\n[assembly: AssemblyDescription("abc")]\n[assembly: AssemblyDescription("abc")]\n[assembly: AssemblyVersion("1.0.47")]\n[assembly: AssemblyFileVersion("1.0.47")]\n'
    );
  });

});
