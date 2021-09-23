var humanString = require('../lib/index');

exports.CheckBasicObjectMapsAcross = function(test) {
	var basic = {
		name: "Test"
	};

	var result = humanString(basic);

	test.equal(result, "name=Test");

	test.done();
};

exports.CheckThatComplexObjectMapsAcross = function(test) {
	var complex = {
		name: "Test",
		sub: {
			name: "Test",
			array: ["Item1", "Item2", "Item3"]
		}
	};

	var result = humanString(complex, {
		maxLevels: 2
	});

	test.equal(result, "name=Test, sub=[name=Test, array=[0=Item1, 1=Item2, 2=Item3]]");

	test.done();
};

exports.CheckThatCustomSeperatorWorks = function(test) {
	var basic = {
		name: "Test",
		email: "example@exmaple.com"
	};

	var result = humanString(basic, {
		separator: "; "
	});

	test.equal(result, "name=Test; email=example@exmaple.com");

	test.done();
};

exports.CheckThatCustomValueSeparatorWorks = function(test) {
	var basic = {
		name: "Test",
		email: "example@exmaple.com"
	};

	var result = humanString(basic, {
		valueSeparator: "-"
	});

	test.equal(result, "name-Test, email-example@exmaple.com");

	test.done();
};

exports.CheckThatCustomLevelLimitWorks = function(test) {
	var basic = {
		name: "Test",
		email: "example@exmaple.com",
		sub: {
			name: "Test",
			array: ["Item1", "Item2", "Item3"],
			sub2: {
				name: "Test",
				array: ["Item1", "Item2", "Item3"]
			}
		}
	};

	var result = humanString(basic, {
		maxLevels: 0
	});

	test.equal(result, "name=Test, email=example@exmaple.com, sub=[object Object]");

	test.done();
};