'use strict';

let fs = require('fs');
let assert = require('chai').assert;
let sinon = require('sinon');
let gemfile = require('../gemfile');
let file = fs.readFileSync('test/Gemfile.lock', 'utf8');

describe('gemfile', function() {
  describe('interpret', function() {
    it('throws when given an argument that isn\'t a String', function() {
      assert.throws(function() {
        gemfile.interpret([]);
      });
    });

    it('warns when the input doesn\'t look like a Gemfile.lock', function() {
      let warn = sinon.stub(console, 'warn');

      gemfile.interpret('hello');

      assert.isTrue(warn.called);
      assert.isTrue(warn.calledWithMatch(/^Are you sure/));

      warn.reset();
    });

    describe('reads a Gemfile.lock', function() {
      it('outputs a JavaScript Object', function() {
        assert.isObject(
          gemfile.interpret(file)
        );
      });

      it('outputs an Object with three mandatory keys', function() {
        let output = gemfile.interpret(file);

        assert.property(output, 'GEM');
        assert.property(output, 'DEPENDENCIES');
        assert.property(output, 'PLATFORMS');
      });

      it('adjusts "BUNDLED WITH" by changing it to a String indicating version', function() {
        let output = gemfile.interpret(file);
        assert.property(output, 'BUNDLED WITH');
        assert.match(output['BUNDLED WITH'], /\d{1,3}\.\d{1,3}\.\d{1,3}/);
      });

      describe('identifies', function() {
        it('paths', function() {
          assert.deepEqual(
            gemfile.interpret('test: some/path'),
            {test: {path: 'some/path'}}
          );
        });

        it('versions', function() {
          assert.deepEqual(
            gemfile.interpret('test (1.0.0)'),
            {test: {version: '1.0.0'}}
          );
        });

        it('outsourced versions', function() {
          assert.deepEqual(
            gemfile.interpret('test (1.0.0)!'),
            {test: {version: '1.0.0', outsourced: true}}
          );
        });

        it('SHAs', function() {
          assert.deepEqual(
            gemfile.interpret('test: abcdefa'),
            {test: {sha: 'abcdefa'}}
          );
        });
      });
    });
  });

  describe('parseSync', function() {
    it('parses a Gemfile.lock with a default location', function() {
      assert.throws(function() {
        gemfile.parseSync();
      }, new RegExp(`${process.cwd()}\/Gemfile\.lock`));
    });

    it('throws if given location does not exist', function() {
      assert.throws(function() {
        gemfile.parseSync('this/is/made/up')
      });
    });

    it('parses a Gemfile.lock with a given location', function() {
      assert.isObject(
        gemfile.parseSync('./test/Gemfile.lock')
      );
    });
  });

  describe('parse', function() {
    it('parses a Gemfile.lock with a default location', function(done) {
      gemfile.parse().then(function() {
        done();
      }, function(error) {
        throw error;
      }, function() {
      }).catch(function() {
        assert.throws(function() {
          gemfile.parseSync();
        }, new RegExp(`${process.cwd()}\/Gemfile\.lock`));
        done();
      });
    });

    it('throws if given location does not exist', function(done) {
      gemfile.parse('this/is/made/up').then(function() {
        throw 'A file was loaded unexpected. Whaa? Magic, I guess.';
      }, function(error) {
        assert.match(error, /Couldn't find a Gemfile/);
        done();
      });
    });

    it('parses a Gemfile.lock with a given location', function(done) {
      gemfile.parse('./test/Gemfile.lock').then(function(data) {
        assert.isObject(data);
        done();
      }).catch(function(error) {
        throw error;
      });
    });
  });

  describe('meta analysis', function () {
    const file = fs.readFileSync('test/Gemfile2.lock', 'utf8');
    it('outputs an Object with three mandatory keys', function() {
      let output = gemfile.interpret(file);

      assert.property(output, 'GEM');
      assert.property(output, 'GIT');
      assert.property(output, 'DEPENDENCIES');
      assert.property(output, 'PLATFORMS');
    });

    it('has a good meta specs', function () {
      let output = gemfile.interpret(file, true);
      assert.property(output.specs, 'rspec');
      assert.property(output.specs, 'nokogiri');
      assert.property(output.specs, 'activemodel');
    });

    it('has actual metadata', function () {
      let output = gemfile.interpret(file, true);
      assert.deepEqual(output.rubyVersion, '2.3.1p0');
      assert.property(output.specs.rspec, 'revision');
    });

    ['Gemfile', 'Gemfile2'].forEach(function(filename) {
      it('returns exactly what we expect for ' + filename, function() {
        let file = fs.readFileSync('test/' + filename + '.lock', 'utf8');
        let expected = JSON.parse(
          fs.readFileSync('test/' + filename + '.json', 'utf8'));
        let output = gemfile.interpret(file, true);
        assert.deepEqual(output, expected, 'deep equals');
      });
    });
  });
});
