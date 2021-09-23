'use strict';
var expect = require('chai').expect;
var Integer = require('../.');
var fromBits = Integer.fromBits;

function equal(a, b) {
	expect(a).to.be.an.instanceof(Integer);
	expect(a.toString()).to.equal(b);
}

describe('Integer.fromBits()', function () {
	it('should work with one argument', function () {
		equal(fromBits(0), '0');
		equal(fromBits(1), '1');
		equal(fromBits(-1), '4294967295');
		equal(fromBits(123), '123');
		equal(fromBits(-123), '4294967173');
		equal(fromBits(0x7fffffff), '2147483647');
		equal(fromBits(-0x80000000), '2147483648');
	});
	it('should work with two arguments', function () {
		equal(fromBits(0, 0), '0');
		equal(fromBits(1, 0), '1');
		equal(fromBits(0, 1), '4294967296');
		equal(fromBits(1, 1), '4294967297');
		equal(fromBits(-1, -1), '-1');
		equal(fromBits(-1, 0), '4294967295');
		equal(fromBits(0, -1), '-4294967296');
		equal(fromBits(123, 321), '1378684502139');
		equal(fromBits(-123, -321), '-1374389534843');
		equal(fromBits(0x7fffffff, 0x7fffffff), '9223372034707292159');
		equal(fromBits(-0x80000000, -0x80000000), '-9223372034707292160');
		equal(fromBits(-1, 0x7fffffff), '9223372036854775807');
		equal(fromBits(0, -0x80000000), '-9223372036854775808');
	});
	it('should throw when an argument is an unaccepted type', function () {
		expect(function () {fromBits();}).to.throw(TypeError);
		expect(function () {fromBits(undefined);}).to.throw(TypeError);
		expect(function () {fromBits(null);}).to.throw(TypeError);
		expect(function () {fromBits([]);}).to.throw(TypeError);
		expect(function () {fromBits(new Number(123));}).to.throw(TypeError);
		expect(function () {fromBits(new String('123'));}).to.throw(TypeError);
		expect(function () {fromBits(0 + Number.EPSILON / 2);}).to.throw(TypeError);
		expect(function () {fromBits(Infinity);}).to.throw(TypeError);
		expect(function () {fromBits(NaN);}).to.throw(TypeError);
		expect(function () {fromBits(0x80000000);}).to.throw(TypeError);
		expect(function () {fromBits(-0x80000001);}).to.throw(TypeError);
		expect(function () {fromBits('123');}).to.throw(TypeError);
		expect(function () {fromBits(Integer(123));}).to.throw(TypeError);
		expect(function () {fromBits(0, undefined);}).to.throw(TypeError);
		expect(function () {fromBits(0, null);}).to.throw(TypeError);
		expect(function () {fromBits(0, []);}).to.throw(TypeError);
		expect(function () {fromBits(0, new Number(123));}).to.throw(TypeError);
		expect(function () {fromBits(0, new String('123'));}).to.throw(TypeError);
		expect(function () {fromBits(0, 0 + Number.EPSILON / 2);}).to.throw(TypeError);
		expect(function () {fromBits(0, Infinity);}).to.throw(TypeError);
		expect(function () {fromBits(0, NaN);}).to.throw(TypeError);
		expect(function () {fromBits(0, 0x80000000);}).to.throw(TypeError);
		expect(function () {fromBits(0, -0x80000001);}).to.throw(TypeError);
		expect(function () {fromBits(0, '123');}).to.throw(TypeError);
		expect(function () {fromBits(0, Integer(123));}).to.throw(TypeError);
	});
});
