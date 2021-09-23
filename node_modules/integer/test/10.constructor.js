'use strict';
var expect = require('chai').expect;
var Integer = require('../.');

function equal(a, b) {
	expect(a).to.be.an.instanceof(Integer);
	expect(a.toNumber()).to.equal(b);
}

describe('Integer()', function () {
	it('should not allow use of the "new" keyword', function () {
		expect(function () {new Integer()}).to.throw(TypeError);
		expect(function () {new Integer(0)}).to.throw(TypeError);
		expect(function () {new Integer(0, 0)}).to.throw(TypeError);
		expect(function () {new Integer(Integer())}).to.throw(TypeError);
	});
	it('should work with no arguments', function () {
		equal(Integer(), 0);
	});
	it('should work with a number argument', function () {
		equal(Integer(0), 0);
		equal(Integer(123), 123);
		equal(Integer(-123), -123);
		equal(Integer(-1, 500), -1);
		equal(Integer(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
		equal(Integer(Number.MIN_SAFE_INTEGER), Number.MIN_SAFE_INTEGER);
	});
	it('should work with a base-10 string argument', function () {
		equal(Integer('0'), 0);
		equal(Integer('123'), 123);
		equal(Integer('-123'), -123);
		equal(Integer('1'), 1);
		equal(Integer('2'), 2);
		equal(Integer('-1'), -1);
		equal(Integer('-2'), -2);
		equal(Integer('0005'), 5);
		equal(Integer('0000'), 0);
		equal(Integer('-0000'), 0);
		equal(Integer('450.'), 450);
		equal(Integer('500.00'), 500);
		equal(Integer('0.0'), 0);
		equal(Integer('.0'), 0);
		equal(Integer('0.'), 0);
		equal(Integer('-.0'), 0);
		equal(Integer('-0.'), 0);
	});
	it('should work with an Integer argument', function () {
		equal(Integer(Integer()), 0);
		equal(Integer(Integer(123)), 123);
	});
	it('should throw when the argument is an unaccepted type', function () {
		expect(function () {Integer(undefined);}).to.throw(TypeError);
		expect(function () {Integer(null);}).to.throw(TypeError);
		expect(function () {Integer([]);}).to.throw(TypeError);
		expect(function () {Integer({low: 123, high: 123});}).to.throw(TypeError);
		expect(function () {Integer(Object.create(Integer()));}).to.throw(TypeError);
		expect(function () {Integer(Object.create(Integer.prototype));}).to.throw(TypeError);
		expect(function () {Integer(new Number(123));}).to.throw(TypeError);
		expect(function () {Integer(new String('123'));}).to.throw(TypeError);
	});
	it('should throw when the argument is a non-integer number', function () {
		expect(function () {Integer(0.1);}).to.throw(TypeError);
		expect(function () {Integer(-0.1);}).to.throw(TypeError);
		expect(function () {Integer(Infinity);}).to.throw(TypeError);
		expect(function () {Integer(-Infinity);}).to.throw(TypeError);
		expect(function () {Integer(NaN);}).to.throw(TypeError);
		expect(function () {Integer(Number.EPSILON / 2);}).to.throw(TypeError);
	});
	it('should throw when the argument is an unsafe number', function () {
		expect(function () {Integer(Number.MAX_SAFE_INTEGER + 1);}).to.throw(RangeError);
		expect(function () {Integer(Number.MIN_SAFE_INTEGER - 1);}).to.throw(RangeError);
	});
	it('should throw when the argument is a string with non-integer characters', function () {
		expect(function () {Integer('a');}).to.throw(TypeError);
		expect(function () {Integer('100g');}).to.throw(TypeError);
		expect(function () {Integer('5.5');}).to.throw(TypeError);
		expect(function () {Integer('5.00050');}).to.throw(TypeError);
		expect(function () {Integer('5.0000000000000000000001');}).to.throw(TypeError);
		expect(function () {Integer('5..');}).to.throw(TypeError);
		expect(function () {Integer('5.0.');}).to.throw(TypeError);
		expect(function () {Integer('5.0.0');}).to.throw(TypeError);
		expect(function () {Integer('.');}).to.throw(TypeError);
		expect(function () {Integer('-.');}).to.throw(TypeError);
		expect(function () {Integer(' . ');}).to.throw(TypeError);
		expect(function () {Integer(' -. ');}).to.throw(TypeError);
		expect(function () {Integer('.p');}).to.throw(TypeError);
		expect(function () {Integer(' .p ');}).to.throw(TypeError);
		expect(function () {Integer(' -.. ');}).to.throw(TypeError);
		expect(function () {Integer('.-');}).to.throw(TypeError);
		expect(function () {Integer('Infinity');}).to.throw(TypeError);
	});
	it('should throw when the argument is a string of a number larger than 64 bits', function () {
		expect(function () {Integer('9223372036854775808');}).to.throw(RangeError);
		expect(function () {Integer('-9223372036854775809');}).to.throw(RangeError);
		expect(function () {Integer('18446744073709551614');}).to.throw(RangeError);
		expect(function () {Integer('18446744073709551616');}).to.throw(RangeError);
		expect(function () {Integer('340282366920938463463374607431768211454');}).to.throw(RangeError);
		expect(function () {Integer('340282366920938463463374607431768211456');}).to.throw(RangeError);
	});
	it('should accept valid strings with whitespace padding', function () {
		equal(Integer('   123    '), 123);
		equal(Integer('\t-123   '), -123);
		equal(Integer('  0005   '), 5);
		equal(Integer(' 0000 '), 0);
		equal(Integer('\n-0000\t'), 0);
		equal(Integer(' \n450.\t\t'), 450);
		equal(Integer(' \n500.00\t \n '), 500);
		equal(Integer('450. '), 450);
		equal(Integer('  -.0  '), 0);
		equal(Integer('  -0.  '), 0);
	});
	it('should throw when the argument is a string containing invalid whitespace', function () {
		expect(function () {Integer('1 23');}).to.throw(TypeError);
		expect(function () {Integer(' - 123');}).to.throw(TypeError);
		expect(function () {Integer('000 5');}).to.throw(TypeError);
		expect(function () {Integer('00 00');}).to.throw(TypeError);
		expect(function () {Integer('- 0000');}).to.throw(TypeError);
		expect(function () {Integer('450 .');}).to.throw(TypeError);
		expect(function () {Integer('450. 0');}).to.throw(TypeError);
		expect(function () {Integer('500 . 00');}).to.throw(TypeError);
		expect(function () {Integer('- .0');}).to.throw(TypeError);
		expect(function () {Integer('-. 0');}).to.throw(TypeError);
		expect(function () {Integer('-0 .');}).to.throw(TypeError);
		expect(function () {Integer('- 0.');}).to.throw(TypeError);
		expect(function () {Integer('');}).to.throw(TypeError);
		expect(function () {Integer('   \r\t ');}).to.throw(TypeError);
	});
});
