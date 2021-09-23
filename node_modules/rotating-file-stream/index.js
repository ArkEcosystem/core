"use strict";

var compress = require("./compress");
var fs = require("fs");
var interval = require("./interval");
var path = require("path");
var util = require("util");
var utils = require("./utils");
var Writable = require("stream").Writable;

function RotatingFileStream(filename, options) {
	if(! (this instanceof RotatingFileStream)) return new RotatingFileStream(filename, options);

	options = utils.checkOptions(options);

	if(typeof filename === "function") this.generator = filename;
	else if(typeof filename === "string")
		if(options.rotate) this.generator = utils.createClassical(filename);
		else this.generator = utils.createGenerator(filename);
	else throw new Error("Don't know how to handle 'filename' type: " + typeof filename);

	if(options.path) {
		var generator = this.generator;

		this.generator = function(time, index) {
			return path.join(options.path, generator(time, index));
		};
	}

	var opt = {};

	if(options.highWaterMark) opt.highWaterMark = options.highWaterMark;

	if(options.mode) opt.mode = options.mode;

	Writable.call(this, opt);

	this.chunks = [];
	this.options = options;
	this.size = 0;
	this.write = this.write; // https://github.com/iccicci/rotating-file-stream/issues/19

	utils.setEvents(this);

	this.firstOpen();
}

util.inherits(RotatingFileStream, Writable);

RotatingFileStream.prototype._close = function(done) {
	if(this.stream) {
		this.stream.on("finish", done);
		this.stream.end();
		this.stream = null;
	}
	else done();
};

RotatingFileStream.prototype._rewrite = function() {
	const self = this;
	const callback = function() {
		if(self.ending) self._close(Writable.prototype.end.bind(self));
	};

	if(this.err) {
		const chunks = this.chunks;

		this.chunks = [];
		chunks.map(e => {
			if(e.cb) e.cb();
		});

		return callback();
	}

	if(this.writing || this.rotation) return;
	if(this.options.size && this.size >= this.options.size) return this.rotate();
	if(! this.stream) return;
	if(! this.chunks.length) return callback();

	const chunk = this.chunks[0];

	this.chunks.shift();
	this.size += chunk.chunk.length;
	this.writing = true;

	this.stream.write(chunk.chunk, function(err) {
		self.writing = false;

		if(err) self.emit("error", err);

		if(chunk.cb) chunk.cb();

		process.nextTick(self._rewrite.bind(self));
	});
};

RotatingFileStream.prototype._write = function(chunk, encoding, callback) {
	this.chunks.push({ chunk: chunk, cb: callback });
	this._rewrite();
};

RotatingFileStream.prototype._writev = function(chunks, callback) {
	chunks[chunks.length - 1].cb = callback;
	this.chunks = this.chunks.concat(chunks);
	this._rewrite();
};

RotatingFileStream.prototype.end = function() {
	var args = [];

	for(var i = 0; i < arguments.length; ++i) {
		if("function" === typeof arguments[i]) {
			this.once("finish", arguments[i]);

			break;
		}

		if(i > 1) break;

		args.push(arguments[i]);
	}

	this.ending = true;

	if(args.length) this.write.apply(this, args);
	else this._rewrite();
};

RotatingFileStream.prototype.firstOpen = function() {
	var self = this;

	if(this.options.immutable) return this.immutate(true);

	this.name = this.generator(null);
	this.once("open", this.interval.bind(this));

	fs.stat(this.name, function(err, stats) {
		if(err) {
			if(err.code === "ENOENT") return self.open();

			return self.emit("error", err);
		}

		if(! stats.isFile()) return self.emit("error", new Error("Can't write on: " + self.name + " (it is not a file)"));

		if(self.options.initialRotation) {
			var prev;

			self._interval(self.now());
			prev = self.prev;
			self._interval(stats.mtime.getTime());

			if(prev !== self.prev) return self.rotate();
		}

		self.size = stats.size;

		if(! self.options.size || stats.size < self.options.size) return self.open();

		if(self.options.interval) self._interval(self.now());

		self.rotate();
	});
};

RotatingFileStream.prototype.immutate = function(first, index, now) {
	if(! index) {
		index = 1;
		now = new Date(this.now());
	}

	if(index >= 1001) return this.emit("error", this.exhausted());

	try {
		this.name = this.generator(now, index);
	}
	catch(e) {
		return this.emit("error", e);
	}

	var open = function(size) {
		this.size = size;
		this.open();
		this.once(
			"open",
			function() {
				if(! first) this.emit("rotated", this.last);

				this.last = this.name;
				this.interval();
			}.bind(this)
		);
	}.bind(this);

	fs.stat(
		this.name,
		function(err, stats) {
			if(err) {
				if(err.code === "ENOENT") return open(0);

				return this.emit("error", err);
			}

			if(! stats.isFile()) return this.emit("error", new Error("Can't write on: " + this.name + " (it is not a file)"));

			if(this.options.size && stats.size >= this.options.size) return this.immutate(first, index + 1, now);

			open(stats.size);
		}.bind(this)
	);
};

RotatingFileStream.prototype.move = function(retry) {
	var name;
	var self = this;

	var callback = function(err) {
		if(err) return self.emit("error", err);

		self.open();

		if(self.options.compress) self.compress(name);
		else {
			self.emit("rotated", name);
			self.interval();
		}
	};

	this.findName({}, self.options.compress, function(err, found) {
		if(err) return callback(err);

		name = found;

		fs.rename(self.name, name, function(err) {
			if(err && err.code !== "ENOENT" && ! retry) return callback(err);

			if(! err) return callback();

			utils.makePath(name, function(err) {
				if(err) return callback(err);

				self.move(true);
			});
		});
	});
};

RotatingFileStream.prototype.now = function() {
	return Date.now();
};

RotatingFileStream.prototype.open = function(retry) {
	var fd;
	var self = this;
	var options = { flags: "a" };
	var callback = function(err) {
		if(err) self.emit("error", err);

		process.nextTick(self._rewrite.bind(self));
	};

	if("mode" in this.options) options.mode = this.options.mode;

	var stream = fs.createWriteStream(this.name, options);

	stream.once("open", function() {
		self.stream = stream;
		self.emit("open", self.name);

		callback();
	});

	stream.once("error", function(err) {
		if(err.code !== "ENOENT" && ! retry) return callback(err);

		utils.makePath(self.name, function(err) {
			if(err) return callback(err);

			self.open(true);
		});
	});
};

RotatingFileStream.prototype.rotate = function() {
	this.size = 0;
	this.rotation = new Date();

	this.emit("rotation");
	this._clear();
	this._close(this.options.rotate ? this.classical.bind(this, this.options.rotate) : this.options.immutable ? this.immutate.bind(this) : this.move.bind(this));
};

for(var i in compress) RotatingFileStream.prototype[i] = compress[i];
for(i in interval) RotatingFileStream.prototype[i] = interval[i];

module.exports = RotatingFileStream;
module.exports.default = RotatingFileStream;
