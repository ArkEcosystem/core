"use strict";

var fs = require("fs");
var path = require("path");

function buildNumberCheck(field) {
	return function(typ, options, val) {
		var value = parseInt(val, 10);

		if(value !== val || value <= 0 || typ !== "number") throw new Error("'" + field + "' option must be a positive integer number");
	};
}

function buildStringCheck(field, check) {
	return function(typ, options, val) {
		if(typ !== "string") throw new Error("Don't know how to handle 'options." + field + "' type: " + typ);

		options[field] = check(val);
	};
}

function checkMeasure(v, what, units) {
	var ret = {};

	ret.num = parseInt(v, 10);

	if(isNaN(ret.num)) throw new Error("Unknown 'options." + what + "' format: " + v);

	if(ret.num <= 0) throw new Error("A positive integer number is expected for 'options." + what + "'");

	ret.unit = v.replace(/^[ 0]*/g, "").substr((ret.num + "").length, 1);

	if(ret.unit.length === 0) throw new Error("Missing unit for 'options." + what + "'");

	if(! units[ret.unit]) throw new Error("Unknown 'options." + what + "' unit: " + ret.unit);

	return ret;
}

var intervalUnits = {
	M: true,
	d: true,
	h: true,
	m: true,
	s: true
};

function checkIntervalUnit(ret, unit, amount) {
	if(parseInt(amount / ret.num, 10) * ret.num !== amount) throw new Error("An integer divider of " + amount + " is expected as " + unit + " for 'options.interval'");
}

function checkInterval(v) {
	var ret = checkMeasure(v, "interval", intervalUnits);

	switch(ret.unit) {
	case "h":
		checkIntervalUnit(ret, "hours", 24);
		break;

	case "m":
		checkIntervalUnit(ret, "minutes", 60);
		break;

	case "s":
		checkIntervalUnit(ret, "seconds", 60);
		break;
	}

	return ret;
}

var sizeUnits = {
	B: true,
	G: true,
	K: true,
	M: true
};

function checkSize(v) {
	var ret = checkMeasure(v, "size", sizeUnits);

	if(ret.unit === "K") return ret.num * 1024;

	if(ret.unit === "M") return ret.num * 1048576;

	if(ret.unit === "G") return ret.num * 1073741824;

	return ret.num;
}

var checks = {
	compress: function(typ, options, val) {
		if(! val) throw new Error("A value for 'options.compress' must be specified");

		if(typ === "boolean")
			options.compress = function(src, dst) {
				return "cat " + src + " | gzip -c9 > " + dst;
			};
		else if(typ === "string") {
			//if(val != "bzip" && val != "gzip")
			if(val !== "gzip") throw new Error("Don't know how to handle compression method: " + val);
		}
		else if(typ !== "function") throw new Error("Don't know how to handle 'options.compress' type: " + typ);
	},

	highWaterMark: function() {},

	history: function(typ) {
		if(typ !== "string") throw new Error("Don't know how to handle 'options.history' type: " + typ);
	},

	immutable: function() {},

	initialRotation: function() {},

	interval: buildStringCheck("interval", checkInterval),

	maxFiles: buildNumberCheck("maxFiles"),

	maxSize: buildStringCheck("maxSize", checkSize),

	mode: function() {},

	path: function(typ) {
		if(typ !== "string") throw new Error("Don't know how to handle 'options.path' type: " + typ);
	},

	rotate: buildNumberCheck("rotate"),

	rotationTime: function() {},

	size: buildStringCheck("size", checkSize)
};

function checkOptions(options) {
	if(! options) return {};

	if(typeof options !== "object") throw new Error("Don't know how to handle 'options' type: " + typeof options);

	var ret = {};

	for(var opt in options) {
		var val = options[opt];
		var typ = typeof val;

		if(! (opt in checks)) throw new Error("Unknown option: " + opt);

		ret[opt] = options[opt];
		checks[opt](typ, ret, val);
	}

	if(! ret.interval) {
		delete ret.immutable;
		delete ret.initialRotation;
		delete ret.rotationTime;
	}

	if(ret.rotate) {
		delete ret.history;
		delete ret.immutable;
		delete ret.maxFiles;
		delete ret.maxSize;
		delete ret.rotationTime;
	}

	if(ret.immutable) delete ret.compress;

	if(ret.rotationTime) delete ret.initialRotation;

	return ret;
}

function pad(num) {
	return (num > 9 ? "" : "0") + num;
}

function createClassical(filename) {
	return function(index) {
		if(! index) return filename;

		return filename + "." + index;
	};
}

function createGenerator(filename) {
	return function(time, index) {
		if(! time) return filename;

		var month = time.getFullYear() + "" + pad(time.getMonth() + 1);
		var day = pad(time.getDate());
		var hour = pad(time.getHours());
		var minute = pad(time.getMinutes());

		return month + day + "-" + hour + minute + "-" + pad(index) + "-" + filename;
	};
}

function makePath(name, callback) {
	var dir = path.parse(name).dir;

	fs.mkdir(dir, function(e) {
		if(e) {
			if(e.code === "ENOENT") return makePath(dir, callback);

			if(e.code !== "EEXIST") return callback(e);
		}

		callback();
	});
}

function setEvents(self) {
	self.once("error", function(err) {
		self.err = err;
		self.end();
	});

	self.once("finish", self._clear.bind(self));

	self.on("rotated", function() {
		self.rotation = null;
		self._rewrite();
	});

	if((self.options.maxFiles || self.options.maxSize) && ! self.options.rotate) self.on("rotated", self.history.bind(self));
}

module.exports = {
	checkOptions:    checkOptions,
	createClassical: createClassical,
	createGenerator: createGenerator,
	makePath:        makePath,
	setEvents:       setEvents
};
