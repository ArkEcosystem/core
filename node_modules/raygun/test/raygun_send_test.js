"use strict";

var test = require("tap").test;
var semver = require("semver");
var VError = require("verror");
var nock = require("nock");

var Raygun = require("../lib/raygun.js");

nock(/.*/)
  .post(/.*/, function() {
    return true;
  })
  .reply(202, {})
  .persist();
var API_KEY = "apikey";

test("send basic", {}, function(t) {
  t.plan(1);

  if (semver.satisfies(process.version, "=0.10")) {
    t.pass("Ignored on node 0.10");
    t.end();
    return;
  }

  var client = new Raygun.Client().init({
    apiKey: API_KEY
  });
  client.send(new Error(), {}, function(response) {
    t.equals(response.statusCode, 202);
    t.end();
  });
});

test("send complex", {}, function(t) {
  t.plan(1);

  if (semver.satisfies(process.version, "=0.10")) {
    t.pass("Ignored on node 0.10");
    t.end();
    return;
  }

  var client = new Raygun.Client()
    .init({ apiKey: API_KEY })
    .setUser("callum@mindscape.co.nz")
    .setVersion("1.0.0.0");

  client.send(new Error(), {}, function(response) {
    t.equals(response.statusCode, 202);
    t.end();
  });
});

test("send with inner error", {}, function(t) {
  t.plan(1);

  if (semver.satisfies(process.version, "=0.10")) {
    t.pass("Ignored on node 0.10");
    t.end();
    return;
  }

  var error = new Error("Outer");
  var innerError = new Error("Inner");

  error.cause = function() {
    return innerError;
  };

  var client = new Raygun.Client().init({
    apiKey: API_KEY
  });
  client.send(error, {}, function(response) {
    t.equals(response.statusCode, 202);
    t.end();
  });
});

test("send with verror", {}, function(t) {
  t.plan(1);

  if (semver.satisfies(process.version, "=0.10")) {
    t.pass("Ignored on node 0.10");
    t.end();
    return;
  }

  var error = new VError(
    new VError(new VError("Deep Error"), "Inner Error"),
    "Outer Error"
  );

  var client = new Raygun.Client().init({
    apiKey: API_KEY
  });
  client.send(error, {}, function(response) {
    t.equals(response.statusCode, 202);
    t.end();
  });
});

test("send with OnBeforeSend", {}, function(t) {
  t.plan(1);

  if (semver.satisfies(process.version, "=0.10")) {
    t.pass("Ignored on node 0.10");
    t.end();
    return;
  }

  var client = new Raygun.Client().init({
    apiKey: API_KEY
  });

  var onBeforeSendCalled = false;
  client.onBeforeSend(function(payload) {
    onBeforeSendCalled = true;
    return payload;
  });

  client.send(new Error(), {}, function() {
    t.equals(onBeforeSendCalled, true);
    t.end();
  });
});

test("send with expressHandler custom data", function(t) {
  t.plan(1);
  var client = new Raygun.Client().init({
    apiKey: API_KEY
  });

  client.expressCustomData = function() {
    return { test: "data" };
  };
  client._send = client.send;
  client.send = function(err, data) {
    client.send = client._send;
    t.equals(data.test, "data");
    t.end();
  };
  client.expressHandler(new Error(), {}, {}, function() {});
});

test("check that tags get passed through", {}, function(t) {
  var tag = ["Test"];
  var client = new Raygun.Client().init({ apiKey: "TEST" });

  client.setTags(tag);

  client.onBeforeSend(function(payload) {
    t.same(payload.details.tags, tag);
    t.end();
  });

  client.send(new Error(), {}, function() {
    t.end();
  });
});

test("check that tags get merged", {}, function(t) {
  var client = new Raygun.Client().init({ apiKey: "TEST" });
  client.setTags(["Tag1"]);

  client.onBeforeSend(function(payload) {
    t.same(payload.details.tags, ["Tag1", "Tag2"]);
    t.end();
  });

  client.send(
    new Error(),
    {},
    function() {
      t.end();
    },
    null,
    ["Tag2"]
  );
});
