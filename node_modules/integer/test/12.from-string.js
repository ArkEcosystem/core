'use strict';
var expect = require('chai').expect;
var Integer = require('../.');
var fromString = Integer.fromString;

function equal(a, b) {
	expect(a).to.be.an.instanceof(Integer);
	expect(a.toString()).to.equal(b);
}

describe('Integer.fromString()', function () {
	it('should work with a base-10 string argument', function () {
		equal(fromString('0'), '0');
		equal(fromString('123'), '123');
		equal(fromString('-123'), '-123');
		equal(fromString('1'), '1');
		equal(fromString('2'), '2');
		equal(fromString('-1'), '-1');
		equal(fromString('-2'), '-2');
		equal(fromString('0005'), '5');
		equal(fromString('0000'), '0');
		equal(fromString('-0000'), '0');
		equal(fromString('450.'), '450');
		equal(fromString('500.00'), '500');
		equal(fromString('0.0'), '0');
		equal(fromString('.0'), '0');
		equal(fromString('0.'), '0');
		equal(fromString('-.0'), '0');
		equal(fromString('-0.'), '0');
		equal(fromString('9223372036854775807'), '9223372036854775807');
		equal(fromString('-9223372036854775808'), '-9223372036854775808');
	});
	it('should throw when the argument is an unaccepted type', function () {
		expect(function () {fromString();}).to.throw(TypeError);
		expect(function () {fromString(undefined);}).to.throw(TypeError);
		expect(function () {fromString(null);}).to.throw(TypeError);
		expect(function () {fromString([]);}).to.throw(TypeError);
		expect(function () {fromString(new String('123'));}).to.throw(TypeError);
		expect(function () {fromString(123);}).to.throw(TypeError);
		expect(function () {fromString(Integer(123));}).to.throw(TypeError);
	});
	it('should throw when the argument is a string with non-integer characters', function () {
		expect(function () {fromString('a');}).to.throw(TypeError);
		expect(function () {fromString('100g');}).to.throw(TypeError);
		expect(function () {fromString('5.5');}).to.throw(TypeError);
		expect(function () {fromString('5.00050');}).to.throw(TypeError);
		expect(function () {fromString('5.0000000000000000000001');}).to.throw(TypeError);
		expect(function () {fromString('5..');}).to.throw(TypeError);
		expect(function () {fromString('5.0.');}).to.throw(TypeError);
		expect(function () {fromString('5.0.0');}).to.throw(TypeError);
		expect(function () {fromString('.');}).to.throw(TypeError);
		expect(function () {fromString('-.');}).to.throw(TypeError);
		expect(function () {fromString(' . ');}).to.throw(TypeError);
		expect(function () {fromString(' -. ');}).to.throw(TypeError);
		expect(function () {fromString('.p');}).to.throw(TypeError);
		expect(function () {fromString(' .p ');}).to.throw(TypeError);
		expect(function () {fromString(' -.. ');}).to.throw(TypeError);
		expect(function () {fromString('.-');}).to.throw(TypeError);
		expect(function () {fromString('Infinity');}).to.throw(TypeError);
	});
	it('should throw when the argument is a string of a number larger than 64 bits', function () {
		expect(function () {fromString('9223372036854775808');}).to.throw(RangeError);
		expect(function () {fromString('-9223372036854775809');}).to.throw(RangeError);
		expect(function () {fromString('18446744073709551614');}).to.throw(RangeError);
		expect(function () {fromString('18446744073709551616');}).to.throw(RangeError);
		expect(function () {fromString('340282366920938463463374607431768211454');}).to.throw(RangeError);
		expect(function () {fromString('340282366920938463463374607431768211456');}).to.throw(RangeError);
	});
	it('should accept valid strings with whitespace padding', function () {
		equal(fromString('   123    '), '123');
		equal(fromString('\t-123   '), '-123');
		equal(fromString('  0005   '), '5');
		equal(fromString(' 0000 '), '0');
		equal(fromString('\n-0000\t'), '0');
		equal(fromString(' \n450.\t\t'), '450');
		equal(fromString(' \n500.00\t \n '), '500');
		equal(fromString('450. '), '450');
		equal(fromString('  -.0  '), '0');
		equal(fromString('  -0.  '), '0');
	});
	it('should throw when the argument is a string containing invalid whitespace', function () {
		expect(function () {fromString('1 23');}).to.throw(TypeError);
		expect(function () {fromString(' - 123');}).to.throw(TypeError);
		expect(function () {fromString('000 5');}).to.throw(TypeError);
		expect(function () {fromString('00 00');}).to.throw(TypeError);
		expect(function () {fromString('- 0000');}).to.throw(TypeError);
		expect(function () {fromString('450 .');}).to.throw(TypeError);
		expect(function () {fromString('450. 0');}).to.throw(TypeError);
		expect(function () {fromString('500 . 00');}).to.throw(TypeError);
		expect(function () {fromString('- .0');}).to.throw(TypeError);
		expect(function () {fromString('-. 0');}).to.throw(TypeError);
		expect(function () {fromString('-0 .');}).to.throw(TypeError);
		expect(function () {fromString('- 0.');}).to.throw(TypeError);
		expect(function () {fromString('');}).to.throw(TypeError);
		expect(function () {fromString('   \r\t ');}).to.throw(TypeError);
	});
	it('should work with strings of other bases', function () {
		equal(fromString('zz', 36), '1295');
		equal(fromString('-1010101', 2), '-85');
		equal(fromString('fffef29edabcdf', 16), '72056437061893343');
		equal(fromString('   zZ.00000   ', 36), '1295');
		equal(fromString('\t\t-1010101.', 2), '-85');
		equal(fromString(' -fFFef29eDabCdf.   ', 16), '-72056437061893343');
		expect(function () {fromString('10121', 2);}).to.throw(TypeError);
		expect(function () {fromString('zz', 35);}).to.throw(TypeError);
		expect(function () {fromString('z{', 36);}).to.throw(TypeError);
		expect(function () {fromString('z[', 36);}).to.throw(TypeError);
		expect(function () {fromString('`a', 36);}).to.throw(TypeError);
		expect(function () {fromString('gffef29edabcdf', 16);}).to.throw(TypeError);
		expect(function () {fromString('5.0.0', 36);}).to.throw(TypeError);
		expect(function () {fromString('.', 36);}).to.throw(TypeError);
		expect(function () {fromString('-.', 36);}).to.throw(TypeError);
		expect(function () {fromString('.{', 36);}).to.throw(TypeError);
		expect(function () {fromString(' .{ ', 36);}).to.throw(TypeError);
		expect(function () {fromString(' -.. ', 36);}).to.throw(TypeError);
		expect(function () {fromString('.-', 36);}).to.throw(TypeError);
	});
	it('should only allow bases within 2 - 36', function () {
		expect(function () {fromString('0', 1);}).to.throw(RangeError);
		expect(function () {fromString('0', 37);}).to.throw(RangeError);
		expect(function () {fromString('0', {});}).to.throw(TypeError);
		expect(function () {fromString('0', new Number(10));}).to.throw(TypeError);
		expect(function () {fromString('0', '10');}).to.throw(TypeError);
		expect(function () {fromString('0', Integer(10));}).to.throw(TypeError);
		expect(function () {fromString('0', -1);}).to.throw(TypeError);
		expect(function () {fromString('0', 0xffffffff + 10);}).to.throw(TypeError);
		expect(function () {fromString('0', 0x7fffffff + 10);}).to.throw(RangeError);
	});
	it('should accept default values as an alternative to throwing exceptions', function () {
		expect(function () {fromString(undefined, 36, '0');}).to.throw(TypeError);
		expect(function () {fromString(123, 36, '0');}).to.throw(TypeError);
		expect(function () {fromString(Integer(123), 36, '0');}).to.throw(TypeError);
		equal(fromString('a', 10, '123'), '123');
		equal(fromString('5.0000000000000000000001', 36, Integer(456)), '456');
		equal(fromString('', 36, '-zz'), '-1295');
		equal(fromString('2', 2, '10101'), '21');
		equal(fromString('9223372036854775808', 10, Integer(555)), '555');
		expect(fromString('18446744073709551616', 10, Integer.ONE)).to.equal(Integer.ONE);
	});
	it('should throw when the default value is not valid', function () {
		expect(function () {fromString('', 10, 123);}).to.throw(TypeError);
		expect(function () {fromString('', 10, new String('123'));}).to.throw(TypeError);
		expect(function () {fromString('', 10, '2.2');}).to.throw(TypeError);
		expect(function () {fromString('', 2, '\t-.\t');}).to.throw(TypeError);
		expect(function () {fromString('', 16, 'g');}).to.throw(TypeError);
		expect(function () {fromString('', 36, '');}).to.throw(TypeError);
	});
});
