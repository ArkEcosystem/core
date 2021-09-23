"use strict";

var test = require("tap").test;
var MessageBuilder = require("../lib/raygun.messageBuilder.js");
var VError = require("verror");

test("basic builder tests", function(t) {
  var builder = new MessageBuilder();
  var message = builder.build();

  t.test("messageBuild", function(tt) {
    tt.ok(message);
    tt.end();
  });

  t.test("occurred on", function(tt) {
    tt.ok(message.occurredOn);
    tt.end();
  });

  t.test("details", function(tt) {
    tt.ok(message.details);
    tt.end();
  });

  t.test("client details", function(tt) {
    tt.ok(message.details.client);
    tt.ok(message.details.client.name);
    tt.ok(message.details.client.version);
    tt.end();
  });

  t.test("machine name", function(tt) {
    var builder = new MessageBuilder();
    builder.setMachineName("server1");
    var message = builder.build();
    tt.equals(message.details.machineName, "server1");
    tt.end();
  });

  t.test("default machine name", function(tt) {
    var builder = new MessageBuilder();
    builder.setMachineName();
    var message = builder.build();
    tt.ok(message.details.machineName);
    tt.end();
  });

  t.test("humanise error string", function(tt) {
    var builder = new MessageBuilder({ useHumanStringForObject: true });
    builder.setErrorDetails({ name: "Test" });

    var message = builder.build();
    tt.ok(message.details.error.message);
    tt.equal("name=Test", message.details.error.message);
    tt.ok(message.details.groupingKey);
    tt.end();
  });

  t.test("dont humanise string", function(tt) {
    var builder = new MessageBuilder({ useHumanStringForObject: false });
    builder.setErrorDetails({ name: "Test" });

    var message = builder.build();
    tt.notOk(message.details.groupingKey);
    tt.equal("NoMessage", message.details.error.message);
    tt.end();
    t.end();
  });
});

test("error builder tests", function(t) {
  var builder = new MessageBuilder();
  builder.setErrorDetails(new Error());
  var message = builder.build();

  t.test("error", function(tt) {
    tt.ok(message.details.error);
    tt.end();
  });

  t.test("stack trace correct", function(tt) {
    var stackTrace = message.details.error.stackTrace;
    stackTrace.forEach(function(stackTraceLine) {
      tt.ok(stackTraceLine.lineNumber);
      tt.ok(stackTraceLine.className);
      tt.ok(stackTraceLine.fileName);
      tt.ok(stackTraceLine.methodName);
    });
    tt.end();
  });

  t.test("error message correct", function(tt) {
    var errorMessage = "WarpCoreAlignment";
    var builder = new MessageBuilder();
    builder.setErrorDetails(new Error(errorMessage));
    var message = builder.build();
    tt.ok(message.details.error.message);
    tt.equals(message.details.error.message, errorMessage);
    tt.end();
  });

  t.test("default error message correct", function(tt) {
    tt.ok(message.details.error.message);
    tt.equals(message.details.error.message, "NoMessage");
    tt.end();
  });

  t.test("class name correct", function(tt) {
    tt.ok(message.details.error.className);
    tt.equals(message.details.error.className, "Error");
    tt.end();
  });

  t.test("error from string", function(tt) {
    var errorMessage = "WarpCoreAlignment";
    var builder = new MessageBuilder();
    builder.setErrorDetails(errorMessage);
    var message = builder.build();
    tt.ok(message.details.error.message);
    tt.equals(message.details.error.message, errorMessage);
    tt.end();
    t.end();
  });
});

test("inner error builder tests", function(t) {
  var innerErrorMessage = "Inner";
  var innerInnerErrorMessage = "InnerInner";

  var innerErrorFieldName = "innerCause";

  var error = new Error("Outer");
  var innerError = new Error(innerErrorMessage);
  var innerInnerError = new Error(innerInnerErrorMessage);

  error[innerErrorFieldName] = function() {
    return innerError;
  };

  innerError[innerErrorFieldName] = function() {
    return innerInnerError;
  };

  var builder = new MessageBuilder({
    innerErrorFieldName: innerErrorFieldName
  });
  builder.setErrorDetails(error);
  var message = builder.build();

  t.test("inner errors", function(tt) {
    tt.ok(message.details.error.innerError);
    tt.ok(message.details.error.innerError.innerError);
    tt.notOk(message.details.error.innerError.innerError.innerError);

    tt.end();
  });

  t.test("inner stack traces correct", function(tt) {
    var stackTraces = [
      message.details.error.innerError.stackTrace,
      message.details.error.innerError.innerError.stackTrace
    ];

    stackTraces.forEach(function(stackTrace) {
      stackTrace.forEach(function(stackTraceLine) {
        tt.ok(stackTraceLine.lineNumber);
        tt.ok(stackTraceLine.className);
        tt.ok(stackTraceLine.fileName);
        tt.ok(stackTraceLine.methodName);
      });
    });
    tt.end();
  });

  t.test("inner errors messages correct", function(tt) {
    tt.ok(message.details.error.innerError.message);
    tt.ok(message.details.error.innerError.innerError.message);

    tt.equal(message.details.error.innerError.message, innerErrorMessage);
    tt.equal(
      message.details.error.innerError.innerError.message,
      innerInnerErrorMessage
    );

    tt.end();
    t.end();
  });
});

test("VError support", function(t) {
  var innerErrorMessage = "Inner";
  var innerInnerErrorMessage = "InnerInner";

  var error = new VError(
    new VError(new VError(innerInnerErrorMessage), innerErrorMessage),
    "Outer Error"
  );

  var builder = new MessageBuilder({ innerErrorFieldName: "cause" });
  builder.setErrorDetails(error);
  var message = builder.build();

  t.test("inner errors", function(tt) {
    tt.ok(message.details.error.innerError);
    tt.ok(message.details.error.innerError.innerError);
    tt.notOk(message.details.error.innerError.innerError.innerError);

    tt.end();
  });

  t.end();
});

test("environment builder", function(t) {
  var builder = new MessageBuilder();
  builder.setEnvironmentDetails();
  var message = builder.build();

  // missing utcOffset for now as need to find a good way to test for its existence
  var properties = [
    "processorCount",
    "osVersion",
    "cpu",
    "architecture",
    "totalPhysicalMemory",
    "availablePhysicalMemory"
  ];

  t.plan(properties.length + 1);

  t.ok(message.details.environment);

  properties.forEach(function(i) {
    t.ok(message.details.environment[i], i + " should be set");
  });
});

test("custom data builder", function(t) {
  t.test("custom data is set", function(tt) {
    var builder = new MessageBuilder();
    builder.setUserCustomData({ foo: "bar" });
    var message = builder.build();

    tt.ok(message.details.userCustomData);
    tt.equals(message.details.userCustomData.foo, "bar");

    tt.end();
  });

  t.test("allow empty custom data", function(tt) {
    var builder = new MessageBuilder();
    builder.setUserCustomData();
    var message = builder.build();
    tt.equals(message.details.userCustomData, undefined);
    tt.end();
    t.end();
  });
});

test("express4 request builder", function(t) {
  var builder = new MessageBuilder();
  builder.setRequestDetails({ hostname: "localhost" });
  var message = builder.build();

  t.ok(message.details.request.hostName);
  t.end();
});

test("express3 request builder", function(t) {
  var builder = new MessageBuilder();
  builder.setRequestDetails({ host: "localhost" });
  var message = builder.build();

  t.ok(message.details.request.hostName);
  t.end();
});

test("user and version builder tests", function(t) {
  t.test("simple user", function(tt) {
    var builder = new MessageBuilder();
    builder.setUser("testuser");
    var message = builder.build();
    tt.equals(message.details.user.identifier, "testuser");
    tt.end();
  });

  t.test("user function", function(tt) {
    var builder = new MessageBuilder();
    builder.setUser(function() {
      return "testuser";
    });
    var message = builder.build();
    tt.equals(message.details.user.identifier, "testuser");
    tt.end();
  });

  t.test("user function returning object", function(tt) {
    var builder = new MessageBuilder();
    builder.setUser(function() {
      return {
        identifier: "testuser",
        email: "test@example.com",
        notSupportedProp: "ignore"
      };
    });
    var message = builder.build();
    tt.equals(message.details.user.identifier, "testuser");
    tt.equals(message.details.user.email, "test@example.com");
    tt.equals(message.details.user.notSupportedProp, undefined);
    tt.end();
  });

  t.test("set user with object", function(tt) {
    var builder = new MessageBuilder();
    builder.setUser({
      identifier: "testuser",
      email: "test@example.com",
      notSupportedProp: "ignore"
    });
    var message = builder.build();
    tt.equals(
      message.details.user.identifier,
      "testuser",
      "identifier should be set to the one in the object we returned from the user function"
    );
    tt.equals(
      message.details.user.email,
      "test@example.com",
      "email should be set to the one in the object we returned from the user function"
    );
    tt.equals(
      message.details.user.notSupportedProp,
      undefined,
      "should skip unknown properties"
    );
    tt.end();
  });

  t.test("version set", function(tt) {
    var builder = new MessageBuilder();
    builder.setVersion("1.0.0.0");
    var message = builder.build();
    tt.equals(message.details.version, "1.0.0.0");
    tt.end();
    t.end();
  });
});

test("filter keys tests", function(t) {
  var builder = new MessageBuilder({
    filters: ["username", "password", "X-ApiKey"]
  });
  var body = {
    username: "admin@raygun.io",
    password: "nice try",
    remember: true
  };
  var queryString = { username: "admin@raygun.io", remember: false };
  var headers = { "X-ApiKey": "123456", Host: "app.raygun.io" };
  builder.setRequestDetails({
    body: body,
    query: queryString,
    headers: headers
  });
  var message = builder.build();

  t.test("form is filtered", function(tt) {
    tt.equals(message.details.request.form.username, undefined);
    tt.equals(message.details.request.form.password, undefined);
    tt.equals(message.details.request.form.remember, true);
    tt.end();
  });

  t.test("query string is filtered", function(tt) {
    tt.equals(message.details.request.queryString.username, undefined);
    tt.equals(message.details.request.queryString.password, undefined);
    tt.equals(message.details.request.queryString.remember, false);
    tt.end();
  });

  t.test("headers are filtered", function(tt) {
    tt.equals(message.details.request.headers["X-ApiKey"], undefined);
    tt.equals(message.details.request.headers["Host"], "app.raygun.io");
    tt.end();
    t.end();
  });
});

test("custom tags", function(t) {
  t.test("with array", function(tt) {
    var builder = new MessageBuilder();
    builder.setTags(["a", "bb", "c"]);
    var message = builder.build();

    tt.deepEqual(message.details.tags, ["a", "bb", "c"]);
    tt.end();
  });

  t.test("with null", function(tt) {
    var builder = new MessageBuilder();
    builder.setTags(null);
    var message = builder.build();

    tt.notOk(message.details.tags);
    tt.end();
  });

  t.test("with undefined", function(tt) {
    var builder = new MessageBuilder();
    builder.setTags(undefined);
    var message = builder.build();

    tt.notOk(message.details.tags);
    tt.end();
  });

  t.test("with non-array type", function(tt) {
    var builder = new MessageBuilder();
    builder.setTags(5);
    var message = builder.build();

    tt.notOk(message.details.tags);
    tt.end();
    t.end();
  });
});
