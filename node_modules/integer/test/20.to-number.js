'use strict';
var expect = require('chai').expect;
var Integer = require('../.');

describe('Integer#toNumber()', function () {
	it('should work when within the safe range', function () {
		expect(Integer(123).toNumber()).to.equal(123);
		expect(Integer(0).toNumber()).to.equal(0);
		expect(Integer(1).toNumber()).to.equal(1);
		expect(Integer(-1).toNumber()).to.equal(-1);
		expect(Integer(Number.MAX_SAFE_INTEGER).toNumber()).to.equal(Number.MAX_SAFE_INTEGER);
		expect(Integer(Number.MIN_SAFE_INTEGER).toNumber()).to.equal(Number.MIN_SAFE_INTEGER);
		expect(Number(Integer(123))).to.equal(123);
		expect(Number(Integer(0))).to.equal(0);
		expect(Number(Integer(1))).to.equal(1);
		expect(Number(Integer(-1))).to.equal(-1);
		expect(Number(Integer(Number.MAX_SAFE_INTEGER))).to.equal(Number.MAX_SAFE_INTEGER);
		expect(Number(Integer(Number.MIN_SAFE_INTEGER))).to.equal(Number.MIN_SAFE_INTEGER);
	});
	it('should throw when outside the safe range', function () {
		var big = Integer(Number.MAX_SAFE_INTEGER).add(1);
		var small = Integer(Number.MIN_SAFE_INTEGER).subtract(1);
		expect(function () {big.toNumber();}).to.throw(RangeError);
		expect(function () {small.toNumber();}).to.throw(RangeError);
		expect(function () {Number(big);}).to.throw(RangeError);
		expect(function () {Number(small);}).to.throw(RangeError);
	});
});
