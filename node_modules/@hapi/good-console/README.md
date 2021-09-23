<a href="http://hapijs.com"><img src="https://raw.githubusercontent.com/hapijs/assets/master/images/family.png" width="180px" align="right" /></a>

# good-console

`good-console` is a transform stream useful for turning [good](https://github.com/hapijs/good) server events into formatted strings.

[![Build Status](https://travis-ci.org/hapijs/good-console.svg?branch=master)](http://travis-ci.org/hapijs/good-console)

## Usage

## `new GoodConsole([config])`
Creates a new GoodConsole object with the following arguments:

- `[config]` - optional configuration object with the following keys
	- `format` - [MomentJS](http://momentjs.com/docs/#/displaying/format/) format string. Defaults to 'YYMMDD/HHmmss.SSS'.
	- `utc` - boolean controlling Moment using [utc mode](http://momentjs.com/docs/#/parsing/utc/) or not. Defaults to `true`.
	- `color` - a boolean specifying whether to output in color. Defaults to `true`.

## Output Formats

Below are example outputs for the designated event type:

- "ops" - 160318/013330.957, [ops] memory: 29Mb, uptime (seconds): 6, load: [1.650390625,1.6162109375,1.65234375]
- "error" - 160318/013330.957, [error,`event.tags`] message: Just a simple error, stack: `event.error.stack`
- "request" - 160318/013330.957, [request,`event.tags`] data: you made a request
- "log" - 160318/013330.957, [log,`event.tags`] data: you made a default
- "response" - 160318/013330.957, [response, `event.tags`] http://localhost:61253: post /data {"name":"adam"} 200 (150ms)
