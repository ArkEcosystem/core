'use strict';
var Integer = require('.');

(new (require('benchmark')).Suite)
.add('RegExp#test', function() {
	Integer.fromString('ab5ef9a8e14b1', 16);
})
.on('cycle', function(event) {
	console.log(String(event.target));
})
.on('complete', function() {
	// console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run({ 'async': true });
