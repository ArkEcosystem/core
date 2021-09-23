'use strict';

var test = require("tap").test;
var Raygun = require('../lib/raygun.js');

var options = {
  apiKey: process.env.RAYGUN_APIKEY
};

test('init', function (t) {
  t.ok(new Raygun.Client().init(options));
  t.end();
});

test('user', function (t) {
  var client = new Raygun.Client().init(options);

  client.user = function (req) {
    return req.user;
  };

  var req = {
    user: "theuser"
  };

  t.equals(client.user(req), "theuser");
  t.end();
});
