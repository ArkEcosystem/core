'use strict';
var expect = require('chai').expect;
var Integer = require('../.');

describe('Logical operations', function () {
	specify('Integer#equals()', function () {
		expect(Integer().equals('0')).to.be.true;
		expect(Integer('23454').equals(23454)).to.be.true;
		expect(Integer('-9223372036854775808').equals(Integer('-9223372036854775807'))).to.be.false;
	});
	specify('Integer#notEquals()', function () {
		expect(Integer().notEquals('0')).to.be.false;
		expect(Integer('23454').notEquals(23454)).to.be.false;
		expect(Integer('-9223372036854775808').notEquals(Integer('-9223372036854775807'))).to.be.true;
	});
	specify('Integer#greaterThan()', function () {
		expect(Integer().greaterThan('0')).to.be.false;
		expect(Integer('23454').greaterThan(-23453)).to.be.true;
		expect(Integer('-9223372036854775808').greaterThan(Integer('-9223372036854775807'))).to.be.false;
	});
	specify('Integer#lessThan()', function () {
		expect(Integer().lessThan('0')).to.be.false;
		expect(Integer('23454').lessThan(-23453)).to.be.false;
		expect(Integer('-9223372036854775808').lessThan(Integer('-9223372036854775807'))).to.be.true;
	});
	specify('Integer#greaterThanOrEquals()', function () {
		expect(Integer().greaterThanOrEquals('0')).to.be.true;
		expect(Integer('23454').greaterThanOrEquals(23454)).to.be.true;
		expect(Integer('-9223372036854775808').greaterThanOrEquals(Integer('-9223372036854775807'))).to.be.false;
	});
	specify('Integer#lessThanOrEquals()', function () {
		expect(Integer().lessThanOrEquals('0')).to.be.true;
		expect(Integer('23454').lessThanOrEquals(23454)).to.be.true;
		expect(Integer('-9223372036854775807').lessThanOrEquals(Integer('-9223372036854775808'))).to.be.false;
	});
	specify('Integer#compare()', function () {
		expect(Integer().compare('5')).to.equal(-1);
		expect(Integer('23454').compare(23454)).to.equal(0);
		expect(Integer('-9223372036854775807').compare(Integer('-9223372036854775808'))).to.equal(1);
	});
	describe('should throw when an invalid argument is provided', function () {
		var count = 0;
		['equals', 'notEquals', 'greaterThan', 'lessThan', 'greaterThanOrEquals', 'lessThanOrEquals', 'compare'].forEach(function (method) {
			specify('Integer#' + method + '()', function () {
				var int = Integer(1);
				expect(function () {int[method]();}).to.throw(TypeError);
				expect(function () {int[method](undefined);}).to.throw(TypeError);
				expect(function () {int[method](null);}).to.throw(TypeError);
				expect(function () {int[method](new String('1'));}).to.throw(TypeError);
				expect(function () {int[method](new Number(1));}).to.throw(TypeError);
				expect(function () {int[method]([]);}).to.throw(TypeError);
				expect(function () {int[method]({low: 1, high: 0});}).to.throw(TypeError);
				expect(function () {int[method](Object.create(Integer(1)));}).to.throw(TypeError);
				expect(function () {int[method](Object.create(Integer.prototype));}).to.throw(TypeError);
			});
			count += 1;
		});
		expect(count).to.equal(7);
	});
});
