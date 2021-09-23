'use strict';
var expect = require('chai').expect;
var Integer = require('../.');
var fromNumber = Integer.fromNumber;

function equal(a, b) {
	expect(a).to.be.an.instanceof(Integer);
	expect(a.toNumber()).to.equal(b);
}

describe('Integer.fromNumber()', function () {
	it('should work with a number argument', function () {
		equal(fromNumber(0), 0);
		equal(fromNumber(123), 123);
		equal(fromNumber(-123), -123);
		equal(fromNumber(-1, 500), -1);
		equal(fromNumber(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
		equal(fromNumber(Number.MIN_SAFE_INTEGER), Number.MIN_SAFE_INTEGER);
	});
	it('should throw when the argument is an unaccepted type', function () {
		expect(function () {fromNumber();}).to.throw(TypeError);
		expect(function () {fromNumber(undefined);}).to.throw(TypeError);
		expect(function () {fromNumber(null);}).to.throw(TypeError);
		expect(function () {fromNumber([]);}).to.throw(TypeError);
		expect(function () {fromNumber(new Number(123));}).to.throw(TypeError);
		expect(function () {fromNumber('123');}).to.throw(TypeError);
		expect(function () {fromNumber(Integer(123));}).to.throw(TypeError);
	});
	it('should throw when the argument is a non-integer number', function () {
		expect(function () {fromNumber(0.1);}).to.throw(TypeError);
		expect(function () {fromNumber(-0.1);}).to.throw(TypeError);
		expect(function () {fromNumber(Infinity);}).to.throw(TypeError);
		expect(function () {fromNumber(-Infinity);}).to.throw(TypeError);
		expect(function () {fromNumber(NaN);}).to.throw(TypeError);
		expect(function () {fromNumber(Number.EPSILON / 2);}).to.throw(TypeError);
	});
	it('should throw when the argument is an unsafe number', function () {
		expect(function () {fromNumber(Number.MAX_SAFE_INTEGER + 1);}).to.throw(RangeError);
		expect(function () {fromNumber(Number.MIN_SAFE_INTEGER - 1);}).to.throw(RangeError);
	});
	it('should accept default values as an alternative to throwing exceptions', function () {
		expect(function () {fromNumber(undefined, 0);}).to.throw(TypeError);
		expect(function () {fromNumber('123', 0);}).to.throw(TypeError);
		expect(function () {fromNumber(Integer(123), 0);}).to.throw(TypeError);
		equal(fromNumber(0.1, 123), 123);
		equal(fromNumber(-0.1, Integer(456)), 456);
		equal(fromNumber(Infinity, -2), -2);
		equal(fromNumber(Number.MAX_SAFE_INTEGER + 1, Integer(555)), 555);
		expect(fromNumber(Number.MIN_SAFE_INTEGER - 1, Integer.ONE)).to.equal(Integer.ONE);
	});
	it('should throw when the default value is not valid', function () {
		expect(function () {fromNumber(Number.MAX_SAFE_INTEGER + 1, '123');}).to.throw(TypeError);
		expect(function () {fromNumber(Number.MAX_SAFE_INTEGER + 1, new Number(123));}).to.throw(TypeError);
		expect(function () {fromNumber(Number.MAX_SAFE_INTEGER + 1, 2.2);}).to.throw(TypeError);
		expect(function () {fromNumber(Number.MAX_SAFE_INTEGER + 1, Infinity);}).to.throw(TypeError);
		expect(function () {fromNumber(Number.MAX_SAFE_INTEGER + 1, Number.MAX_SAFE_INTEGER + 1);}).to.throw(TypeError);
	});
});
