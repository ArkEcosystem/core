'use strict';
var expect = require('chai').expect;
var Integer = require('../.');

describe('Utility', function () {
	specify('Integer#bitSizeAbs()', function () {
		expect(Integer(0).bitSizeAbs()).to.equal(1);
		expect(Integer('-1').bitSizeAbs()).to.equal(1);
		expect(Integer(2).bitSizeAbs()).to.equal(2);
		expect(Integer(128).bitSizeAbs()).to.equal(8);
		expect(Integer(-255).bitSizeAbs()).to.equal(8);
		expect(Integer(87960930222079).bitSizeAbs()).to.equal(47);
		expect(Integer('9223372036854775807').bitSizeAbs()).to.equal(63);
		expect(Integer('-9223372036854775808').bitSizeAbs()).to.equal(64);
	});
	specify('Integer#isEven()', function () {
		expect(Integer(0).isEven()).to.be.true;
		expect(Integer('1').isEven()).to.be.false;
		expect(Integer(-3).isEven()).to.be.false;
		expect(Integer(87960930222078).isEven()).to.be.true;
		expect(Integer('9223372036854775807').isEven()).to.be.false;
		expect(Integer('-9223372036854775808').isEven()).to.be.true;
	});
	specify('Integer#isOdd()', function () {
		expect(Integer(0).isOdd()).to.be.false;
		expect(Integer('1').isOdd()).to.be.true;
		expect(Integer(-3).isOdd()).to.be.true;
		expect(Integer(87960930222078).isOdd()).to.be.false;
		expect(Integer('9223372036854775807').isOdd()).to.be.true;
		expect(Integer('-9223372036854775808').isOdd()).to.be.false;
	});
	specify('Integer#isPositive()', function () {
		expect(Integer(0).isPositive()).to.be.true;
		expect(Integer('1').isPositive()).to.be.true;
		expect(Integer(-3).isPositive()).to.be.false;
		expect(Integer(87960930222078).isPositive()).to.be.true;
		expect(Integer('9223372036854775807').isPositive()).to.be.true;
		expect(Integer('-9223372036854775808').isPositive()).to.be.false;
	});
	specify('Integer#isNegative()', function () {
		expect(Integer(0).isNegative()).to.be.false;
		expect(Integer('1').isNegative()).to.be.false;
		expect(Integer(-3).isNegative()).to.be.true;
		expect(Integer(87960930222078).isNegative()).to.be.false;
		expect(Integer('9223372036854775807').isNegative()).to.be.false;
		expect(Integer('-9223372036854775808').isNegative()).to.be.true;
	});
	specify('Integer#isZero()', function () {
		expect(Integer(0).isZero()).to.be.true;
		expect(Integer('1').isZero()).to.be.false;
		expect(Integer(-3).isZero()).to.be.false;
		expect(Integer(87960930222078).isZero()).to.be.false;
		expect(Integer('9223372036854775807').isZero()).to.be.false;
		expect(Integer('-9223372036854775808').isZero()).to.be.false;
	});
	specify('Integer#isNonZero()', function () {
		expect(Integer(0).isNonZero()).to.be.false;
		expect(Integer('1').isNonZero()).to.be.true;
		expect(Integer(-3).isNonZero()).to.be.true;
		expect(Integer(87960930222078).isNonZero()).to.be.true;
		expect(Integer('9223372036854775807').isNonZero()).to.be.true;
		expect(Integer('-9223372036854775808').isNonZero()).to.be.true;
	});
	specify('Integer#isSafe()', function () {
		expect(Integer(0).isSafe()).to.be.true;
		expect(Integer('1').isSafe()).to.be.true;
		expect(Integer(-3).isSafe()).to.be.true;
		expect(Integer(87960930222078).isSafe()).to.be.true;
		expect(Integer('9223372036854775807').isSafe()).to.be.false;
		expect(Integer('-9223372036854775808').isSafe()).to.be.false;
		expect(Integer(Number.MAX_SAFE_INTEGER).isSafe()).to.be.true;
		expect(Integer(Number.MIN_SAFE_INTEGER).isSafe()).to.be.true;
		expect(Integer(Number.MAX_SAFE_INTEGER).add(1).isSafe()).to.be.false;
		expect(Integer(Number.MIN_SAFE_INTEGER).add(-1).isSafe()).to.be.false;
	});
	specify('Integer#isUnsafe()', function () {
		expect(Integer(0).isUnsafe()).to.be.false;
		expect(Integer('1').isUnsafe()).to.be.false;
		expect(Integer(-3).isUnsafe()).to.be.false;
		expect(Integer(87960930222078).isUnsafe()).to.be.false;
		expect(Integer('9223372036854775807').isUnsafe()).to.be.true;
		expect(Integer('-9223372036854775808').isUnsafe()).to.be.true;
		expect(Integer(Number.MAX_SAFE_INTEGER).isUnsafe()).to.be.false;
		expect(Integer(Number.MIN_SAFE_INTEGER).isUnsafe()).to.be.false;
		expect(Integer(Number.MAX_SAFE_INTEGER).add(1).isUnsafe()).to.be.true;
		expect(Integer(Number.MIN_SAFE_INTEGER).add(-1).isUnsafe()).to.be.true;
	});
	specify('Integer.isInstance()', function () {
		var isInstance = Integer.isInstance;
		var copycat = Object.create(Integer.prototype);
		['low', 'high'].forEach(function (name) {
			Object.defineProperty(copycat, name, {
				enumerable: true,
				configurable: true,
				get: function () {return 0;}
			});
		});
		expect(isInstance()).to.be.false;
		expect(isInstance(undefined)).to.be.false;
		expect(isInstance(null)).to.be.false;
		expect(isInstance(123)).to.be.false;
		expect(isInstance('123')).to.be.false;
		expect(isInstance(new Number(123))).to.be.false;
		expect(isInstance(new String('123'))).to.be.false;
		expect(isInstance({})).to.be.false;
		expect(isInstance(Object.create(Integer.prototype))).to.be.false;
		expect(isInstance(Object.create(Integer()))).to.be.false;
		expect(isInstance(copycat)).to.be.false;
		expect(isInstance(Integer())).to.be.true;
		expect(isInstance(Integer('9223372036854775807'))).to.be.true;
		expect(isInstance(Integer('-9223372036854775808'))).to.be.true;
	});
});
