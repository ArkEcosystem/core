'use strict';
var expect = require('chai').expect;
var Integer = require('../.');

describe('Integer#low and Integer#high', function () {
	it('should return the lower 32 bits', function () {
		expect(Integer.fromBits(0).low).equal(0);
		expect(Integer.fromBits(1).low).equal(1);
		expect(Integer.fromBits(123).low).equal(123);
		expect(Integer.fromBits(-1).low).equal(-1);
		expect(Integer.fromBits(0x7fffffff).low).equal(0x7fffffff);
		expect(Integer.fromBits(-0x80000000).low).equal(-0x80000000);
		expect(Integer.fromBits(0, 555).low).equal(0);
		expect(Integer.fromBits(1, 555).low).equal(1);
		expect(Integer.fromBits(123, 555).low).equal(123);
		expect(Integer.fromBits(-1, 555).low).equal(-1);
		expect(Integer.fromBits(0x7fffffff, 555).low).equal(0x7fffffff);
		expect(Integer.fromBits(-0x80000000, 555).low).equal(-0x80000000);
	});
	it('should return the higher 32 bits', function () {
		expect(Integer.fromBits(0, 0).high).equal(0);
		expect(Integer.fromBits(0, 1).high).equal(1);
		expect(Integer.fromBits(0, 123).high).equal(123);
		expect(Integer.fromBits(0, -1).high).equal(-1);
		expect(Integer.fromBits(0, 0x7fffffff).high).equal(0x7fffffff);
		expect(Integer.fromBits(0, -0x80000000).high).equal(-0x80000000);
		expect(Integer.fromBits(555, 0).high).equal(0);
		expect(Integer.fromBits(555, 1).high).equal(1);
		expect(Integer.fromBits(555, 123).high).equal(123);
		expect(Integer.fromBits(555, -1).high).equal(-1);
		expect(Integer.fromBits(555, 0x7fffffff).high).equal(0x7fffffff);
		expect(Integer.fromBits(555, -0x80000000).high).equal(-0x80000000);
	});
});
