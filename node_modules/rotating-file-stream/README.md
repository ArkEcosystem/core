# rotating-file-stream

[![Build Status](https://travis-ci.org/iccicci/rotating-file-stream.png?branch=master)](https://travis-ci.org/iccicci/rotating-file-stream?branch=master)
[![Code Climate](https://codeclimate.com/github/iccicci/rotating-file-stream/badges/gpa.svg)](https://codeclimate.com/github/iccicci/rotating-file-stream)
[![Test Coverage](https://codeclimate.com/github/iccicci/rotating-file-stream/badges/coverage.svg)](https://codeclimate.com/github/iccicci/rotating-file-stream/coverage)
[![Donate](https://img.shields.io/badge/donate-bitcoin-blue.svg)](https://blockchain.info/address/12p1p5q7sK75tPyuesZmssiMYr4TKzpSCN)

[![NPM version](https://badge.fury.io/js/rotating-file-stream.svg)](https://www.npmjs.com/package/rotating-file-stream)
[![Dependencies](https://david-dm.org/iccicci/rotating-file-stream.svg)](https://david-dm.org/iccicci/rotating-file-stream)
[![Dev Dependencies](https://david-dm.org/iccicci/rotating-file-stream/dev-status.svg)](https://david-dm.org/iccicci/rotating-file-stream?type=dev)

[![NPM](https://nodei.co/npm/rotating-file-stream.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/rotating-file-stream/)

### Description

Creates a [stream.Writable](https://nodejs.org/api/stream.html#stream_class_stream_writable) to a file which is rotated.
Rotation behaviour can be deeply customized; optionally, classical UNIX **logrotate** behaviour can be used.

### Usage

```javascript
var rfs = require("rotating-file-stream");
var stream = rfs("file.log", {
	size: "10M", // rotate every 10 MegaBytes written
	interval: "1d", // rotate daily
	compress: "gzip" // compress rotated files
});
```

### Installation

With [npm](https://www.npmjs.com/package/rotating-file-stream):

```sh
$ npm install --save rotating-file-stream
```

### Table of contents

- [API](#api)
  - [Class: RotatingFileStream](#class-rotatingfilestream)
  - [RotatingFileStream(filename, options)](#new-rotatingfilestreamfilename-options)
    - [filename](#filename-stringfunction)
    - [options](#options-object)
      - [compress](#compress)
      - [history](#history)
      - [immutable](#immutable)
      - [initialRotation](#initialrotation)
      - [interval](#interval)
      - [maxFiles](#maxfiles)
      - [maxSize](#maxsize)
      - [path](#path)
      - [rotate](#rotate)
      - [rotationTime](#rotationtime)
      - [size](#size)
  - [Events](#events)
  - [Rotation logic](#rotation-logic)
  - [Under the hood](#under-the-hood)
  - [Compatibility](#compatibility)
  - [TypeScript](#typescript)
  - [Licence](#licence)
  - [Bugs](#bugs)
  - [ChangeLog](#changelog)
  - [Donating](#donating)

# API

```javascript
require("rotating-file-stream");
```

Returns **RotatingFileStream** constructor.

## Class: RotatingFileStream

Extends [stream.Writable](https://nodejs.org/api/stream.html#stream_class_stream_writable).

## [new] RotatingFileStream(filename, options)

Returns a new **RotatingFileStream** to _filename_ as
[fs.createWriteStream](https://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options) does.
The file is rotated following _options_ rules.

### filename {String|Function}

The most complex problem about file name is: "how to call the rotated file name?"

The answer to this question may vary in many forms depending on application requirements and/or specifications.
If there are no requirements, a _String_ can be used and _default rotated file name generator_ will be used;
otherwise a _Function_ which returns the _rotated file name_ can be used.

#### function filename(time, index)

- time: {Date} If both rotation by interval is enabled and **options.rotationTime** [(see below)](#rotationtime) is
  **false**, the start time of rotation period, otherwise the time when rotation job started. If **null**, the
  _not-rotated file name_ must be returned.
- index {Number} The progressive index of rotation by size in the same rotation period.

An example of a complex _rotated file name generator_ function could be:

```javascript
function pad(num) {
	return (num > 9 ? "" : "0") + num;
}

function generator(time, index) {
	if (!time) return "file.log";

	var month = time.getFullYear() + "" + pad(time.getMonth() + 1);
	var day = pad(time.getDate());
	var hour = pad(time.getHours());
	var minute = pad(time.getMinutes());

	return month + "/" + month + day + "-" + hour + minute + "-" + index + "-file.log";
}

var rfs = require("rotating-file-stream");
var stream = rfs(generator, {
	size: "10M",
	interval: "30m"
});
```

**Note:**
if both rotation by interval and rotation by time are used, returned _rotated file name_ **must** be function of both
parameters _time_ and _index_. Alternatively, **rotationTime** _option_ can be used (to see below).

If classical **logrotate** behaviour is enabled _rotated file name_ is only a function of _index_.

#### function filename(index)

- index {Number} The progressive index of rotation. If **null**, the _not-rotated file name_ must be returned.

**Note:**
The _not-rotated file name_ **must** be only the _filename_, to specify a _path_ the appropriate option **must** be used.

```javascript
rfs("path/to/file.log"); // wrong
rfs("file.log", { path: "path/to" }); // OK
```

**Note:**
if part of returned destination path does not exists, the rotation job will try to create it.

### options {Object}

- compress: {String|Function|True} (default: null) Specifies compression method of rotated files.
- highWaterMark: {Number} (default: null) Proxied to [new stream.Writable](https://nodejs.org/api/stream.html#stream_constructor_new_stream_writable_options)
- history: {String} (default: null) Specifies the _history filename_.
- immutable: {Boolean} (default: null) Never mutates file names.
- initialRotation: {Boolean} (default: null) Initial rotation based on _not-rotated file_ timestamp.
- interval: {String} (default: null) Specifies the time interval to rotate the file.
- maxFiles: {Integer} (default: null) Specifies the maximum number of rotated files to keep.
- maxSize: {String} (default: null) Specifies the maximum size of rotated files to keep.
- mode: {Integer} (default: null) Proxied to [fs.createWriteStream](https://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options)
- path: {String} (default: null) Specifies the base path for files.
- rotate: {Integer} (default: null) Enables the classical UNIX **logrotate** behaviour.
- rotationTime: {Boolean} (default: null) Makes rotated file name with time of rotation.
- size: {String} (default: null) Specifies the file size to rotate the file.

#### path

If present, it is prepended to generated file names as well as for history file.

#### size

Accepts a positive integer followed by one of these possible letters:

- **B**: Bites
- **K**: KiloBites
- **M**: MegaBytes
- **G**: GigaBytes

```javascript
  size: '300B', // rotates the file when size exceeds 300 Bytes
                // useful for tests
```

```javascript
  size: '300K', // rotates the file when size exceeds 300 KiloBytes
```

```javascript
  size: '100M', // rotates the file when size exceeds 100 MegaBytes
```

```javascript
  size: '1G', // rotates the file when size exceeds a GigaByte
```

#### interval

Accepts a positive integer followed by one of these possible letters:

- **s**: seconds. Accepts integer divider of 60.
- **m**: minutes. Accepts integer divider of 60.
- **h**: hours. Accepts integer divider of 24.
- **d**: days. Accepts integer.
- **M**: months. Accepts integer. **EXPERIMENTAL**

```javascript
  interval: '5s', // rotates at seconds 0, 5, 10, 15 and so on
                  // useful for tests
```

```javascript
  interval: '5m', // rotates at minutes 0, 5, 10, 15 and so on
```

```javascript
  interval: '2h', // rotates at midnight, 02:00, 04:00 and so on
```

```javascript
  interval: '1d', // rotates at every midnight
```

```javascript
  interval: '1M', // rotates at every midnight between two distinct months
```

#### compress

Due the nature of **Node.js** compression may be done with an external command (to use other CPUs than the one used
by **Node.js**) or with internal code (to use the CPU used by **Node.js**). This decision is left to you.

Following fixed strings are allowed to compress the files with internal libraries:

- bzip2 (**not implemented yet**)
- gzip

To enable external compression, a _function_ can be used or simply the _boolean_ **true** value to use default
external compression.
The function should accept _source_ and _dest_ file names and must return the shell command to be executed to
compress the file.
The two following code snippets have exactly the same effect:

```javascript
var rfs = require("rotating-file-stream");
var stream = rfs("file.log", {
	size: "10M",
	compress: true
});
```

```javascript
var rfs = require("rotating-file-stream");
var stream = rfs("file.log", {
	size: "10M",
	compress: function(source, dest) {
		return "cat " + source + " | gzip -c9 > " + dest;
	}
});
```

**Note:**
this option is ignored if **immutable** is set to **true**.

**Note:**
the shell command to compress the rotated file should not remove the source file, it will be removed by the package
if rotation job complete with success.

#### initialRotation

When program stops in a rotation period then restarts in a new rotation period, logs of different rotation period will
go in the next rotated file; in a few words: a rotation job is lost. If this option is set to **true** an initial check
is performed against the _not-rotated file_ timestamp and, if it falls in a previous rotation period, an initial
rotation job is done as well.

**Note:**
this option is ignored if **rotationTime** is set to **true**.

#### rotate

If specified, classical UNIX **logrotate** behaviour is enabled and the value of this option has same effect in
_logrotate.conf_ file.

**Note:**
following options are ignored if **rotate** option is specified.

#### immutable

If set to **true**, names of generated files never changes. In other words the _rotated file name generator_ is never
called with a **null** _time_ parameter and new files are immediately generated with their rotated name.
**rotation** _event_ now has a _filename_ parameter with the newly created file name.
Useful to send logs to logstash through filebeat.

**Note:**
if this option is set to **true**, **compress** is ignored.

**Note:**
this option is ignored if **interval** is not set.

#### rotationTime

As specified above, if rotation by interval is enabled, the parameter _time_ passed to _rotated file name generator_ is the
start time of rotation period. Setting this option to **true**, parameter _time_ passed is time when rotation job
started.

**Note:**
if this option is set to **true**, **initialRotation** is ignored.

#### history

Due to the complexity that _rotated file names_ can have because of the _filename generator function_, if number or
size of rotated files should not exceed a given limit, the package needs a file where to store this information. This
option specifies the name of that file. This option takes effect only if at least one of **maxFiles** or **maxSize**
is used. If **null**, the _not rotated filename_ with the '.txt' suffix is used.

#### maxFiles

If specified, it's value is the maximum number of _rotated files_ to be kept.

#### maxSize

If specified, it's value must respect same syntax of [size](#size) option and is the maximum size of _rotated files_
to be kept.

## Events

Custom _Events_ are emitted by the stream.

```javascript
var rfs    = require('rotating-file-stream');
var stream = rfs(...);

stream.on('error', function(err) {
    // here are reported blocking errors
    // once this event is emitted, the stream will be closed as well
});

stream.on('open', function(filename) {
    // no rotated file is open (emitted after each rotation as well)
    // filename: useful if immutable option is true
});

stream.on('removed', function(filename, number) {
    // rotation job removed the specified old rotated file
    // number == true, the file was removed to not exceed maxFiles
    // number == false, the file was removed to not exceed maxSize
});

stream.on('rotation', function() {
    // rotation job started
});

stream.on('rotated', function(filename) {
    // rotation job completed with success producing given filename
});

stream.on('warning', function(err) {
    // here are reported non blocking errors
});
```

## Rotation logic

Regardless of when and why rotation happens, the content of a single
[stream.write](https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback)
will never be split among two files.

### by size

Once the _not-rotated_ file is opened first time, its size is checked and if it is greater or equal to
size limit, a first rotation happens. After each
[stream.write](https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback),
the same check is performed.

### by interval

The package sets a [Timeout](https://nodejs.org/api/timers.html#timers_settimeout_callback_delay_args)
to start a rotation job at the right moment.

## Under the hood

Logs should be handled so carefully, so this package tries to never overwrite files.

At stream creation, if the _not-rotated_ log file already exists and its size exceeds the rotation size,
an initial rotation attempt is done.

At each rotation attempt a check is done to verify that destination rotated file does not exists yet;
if this is not the case a new destination _rotated file name_ is generated and the same check is
performed before going on. This is repeated until a not existing destination file name is found or the
package is exhausted. For this reason the _rotated file name generator_ function may be called several
times for each rotation job.

If requested by **maxFiles** or **maxSize** options, at the end of a rotation job, a check is performed to ensure that
given limits are respected. This means that **while rotation job is running both the limits could be not respected**,
the same can happen (if **maxFiles** or **maxSize** are changed) till the end of first _rotation job_.
The first check performed is the one against **maxFiles**, in case some files are removed, then the check against
**maxSize** is performed, finally other files can be removed. When **maxFiles** or **maxSize** are enabled for first
time, an _history file_ can be created with one _rotated filename_ (as returned by _filename generator function_) at
each line.

Once an **error** _event_ is emitted, nothing more can be done: the stream is closed as well.

## Compatibility

The package is tested under [all Node.js versions](https://travis-ci.org/iccicci/rotating-file-stream)
currently supported accordingly to [Node.js Release](https://github.com/nodejs/Release).

## TypeScript

To import the package in a **TypeScript** project, use following import statement.

```typescript
import rfs from "rotating-file-stream";
```

## Licence

[MIT Licence](https://github.com/iccicci/rotating-file-stream/blob/master/LICENSE)

## Bugs

Do not hesitate to report any bug or inconsistency [@github](https://github.com/iccicci/rotating-file-stream/issues).

## ChangeLog

[ChangeLog](https://github.com/iccicci/rotating-file-stream/blob/master/CHANGELOG.md)

## Donating

If you find useful this package, please consider the opportunity to donate some satoshis to this bitcoin address:
**12p1p5q7sK75tPyuesZmssiMYr4TKzpSCN**
