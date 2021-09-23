'use strict';
var expect = require('chai').expect;
var Integer = require('../.');

describe('Integer#toNumberUnsafe()', function () {
	it('should work when within the safe range', function () {
		expect(Integer(123).toNumberUnsafe()).to.equal(123);
		expect(Integer(0).toNumberUnsafe()).to.equal(0);
		expect(Integer(1).toNumberUnsafe()).to.equal(1);
		expect(Integer(-1).toNumberUnsafe()).to.equal(-1);
		expect(Integer(Number.MAX_SAFE_INTEGER).toNumberUnsafe()).to.equal(Number.MAX_SAFE_INTEGER);
		expect(Integer(Number.MIN_SAFE_INTEGER).toNumberUnsafe()).to.equal(Number.MIN_SAFE_INTEGER);
	});
	it('should return approximate results when outside the safe range', function () {
		var big = Integer(Number.MAX_SAFE_INTEGER);
		var small = Integer(Number.MIN_SAFE_INTEGER);
		expect(big.add(1).toNumberUnsafe()).to.equal(Number.MAX_SAFE_INTEGER + 1);
		expect(small.subtract(1).toNumberUnsafe()).to.equal(Number.MIN_SAFE_INTEGER - 1);
		expect(big.add(100).toNumberUnsafe()).to.equal(Number.MAX_SAFE_INTEGER + 101);
		expect(small.subtract(100).toNumberUnsafe()).to.equal(Number.MIN_SAFE_INTEGER - 101);
		expect(Integer('9223372036854775807').toNumberUnsafe()).to.equal(9223372036854776000);
		expect(Integer('-9223372036854775808').toNumberUnsafe()).to.equal(-9223372036854776000);
	});
});
