"use strict";

var fs = require("fs");
var util = require("util");

function _clear(done) {
	if(this.timer) {
		clearTimeout(this.timer);
		this.timer = null;
	}
}

function __interval(now) {
	now = new Date(now);
	var year = now.getFullYear();
	var month = now.getMonth();
	var day = now.getDate();
	var hours = now.getHours();
	var num = this.options.interval.num;
	var unit = this.options.interval.unit;

	if(unit === "M") {
		day = 1;
		hours = 0;
	}
	else if(unit === "d") hours = 0;
	else hours = parseInt(hours / num, 10) * num;

	this.prev = new Date(year, month, day, hours, 0, 0, 0).getTime();

	if(unit === "M") month += num;
	else if(unit === "d") day += num;
	else hours += num;

	this.next = new Date(year, month, day, hours, 0, 0, 0).getTime();
}

function _interval(now) {
	var unit = this.options.interval.unit;

	if(unit === "M" || unit === "d" || unit === "h") this.__interval(now);
	else {
		var period = 1000 * this.options.interval.num;

		if(unit === "m") period *= 60;

		this.prev = parseInt(now / period, 10) * period;
		this.next = this.prev + period;
	}

	return new Date(this.prev);
}

function interval() {
	if(! this.options.interval) return;

	this._interval(this.now());

	var self = this;
	var set = function() {
		var time = self.next - self.now();

		self.timer = time > self.maxTimeout ? setTimeout(set, self.maxTimeout) : setTimeout(self.rotate.bind(self), time);
		self.timer.unref();
	};

	set();
}

function historyWrite(self, res) {
	var files = [];

	res.map(e => files.push(e.name));

	fs.writeFile(self.options.history, files.join("\n"), "utf8", function(err) {
		if(err) self.emit("warning", err);

		self.emit("history");
	});
}

function historyRemove(self, res, step, number) {
	var file = res.shift();

	fs.unlink(file.name, function(err) {
		if(err) self.emit("warning", err);
		else self.emit("removed", file.name, number);

		step(self, res);
	});
}

function historyCheckSize(self, res) {
	if(! self.options.maxSize) return historyWrite(self, res);

	var size = 0;

	res.map(e => (size += e.size));

	if(size <= self.options.maxSize) return historyWrite(self, res);

	historyRemove(self, res, historyCheckSize, false);
}

function historyCheckFiles(self, res) {
	res.sort(function(a, b) {
		return a.time - b.time;
	});

	if(! self.options.maxFiles || res.length <= self.options.maxFiles) return historyCheckSize(self, res);

	historyRemove(self, res, historyCheckFiles, true);
}

function historyGather(self, files, idx, res) {
	if(idx === files.length) return historyCheckFiles(self, res);

	fs.stat(files[idx], function(err, stats) {
		if(err) {
			if(err.code !== "ENOENT") return self.emit("warning", err);
		}
		else if(stats.isFile())
			res.push({
				name: files[idx],
				size: stats.size,
				time: stats.ctime.getTime()
			});
		else self.emit("warning", "File '" + files[idx] + "' contained in history is not a regular file");

		historyGather(self, files, idx + 1, res);
	});
}

function history(lastfile) {
	var filename = this.options.history;
	var self = this;

	if(! filename) this.options.history = filename = this.generator(null) + ".txt";

	fs.readFile(filename, "utf8", function(err, data) {
		if(err) {
			if(err.code !== "ENOENT") return self.emit("warning", err);

			return historyGather(self, [lastfile], 0, []);
		}

		var files = data.split("\n");

		files.push(lastfile);
		historyGather(self, files, 0, []);
	});
}

module.exports = {
	__interval: __interval,
	_clear:     _clear,
	_interval:  _interval,
	history:    history,
	interval:   interval,
	maxTimeout: 2147483640
};
