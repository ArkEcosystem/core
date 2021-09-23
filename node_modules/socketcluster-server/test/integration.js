var assert = require('assert');
var socketClusterServer = require('../');
var socketCluster = require('socketcluster-client');
var localStorage = require('localStorage');
var SCSimpleBroker = require('sc-simple-broker').SCSimpleBroker;

// Add to the global scope like in browser.
global.localStorage = localStorage;

var portNumber = 8008;

var clientOptions;
var serverOptions;

var allowedUsers = {
  bob: true,
  alice: true
};

var TEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 10;
var WS_ENGINE = 'ws';

var validSignedAuthTokenBob = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImJvYiIsImV4cCI6MzE2Mzc1ODk3OTA4MDMxMCwiaWF0IjoxNTAyNzQ3NzQ2fQ.dSZOfsImq4AvCu-Or3Fcmo7JNv1hrV3WqxaiSKkTtAo';
var validSignedAuthTokenAlice = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFsaWNlIiwiaWF0IjoxNTE4NzI4MjU5LCJleHAiOjMxNjM3NTg5NzkwODAzMTB9.XxbzPPnnXrJfZrS0FJwb_EAhIu2VY5i7rGyUThtNLh4';
var invalidSignedAuthToken = 'fakebGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fakec2VybmFtZSI6ImJvYiIsImlhdCI6MTUwMjYyNTIxMywiZXhwIjoxNTAyNzExNjEzfQ.fakemYcOOjM9bzmS4UYRvlWSk_lm3WGHvclmFjLbyOk';

var server, client;

var connectionHandler = function (socket) {
  socket.on('login', function (userDetails, respond) {
    if (allowedUsers[userDetails.username]) {
      socket.setAuthToken(userDetails);
      respond();
    } else {
      var err = new Error('Failed to login');
      err.name = 'FailedLoginError';
      respond(err);
    }
  });
  socket.on('loginWithTenDayExpiry', function (userDetails, respond) {
    if (allowedUsers[userDetails.username]) {
      socket.setAuthToken(userDetails, {
        expiresIn: TEN_DAYS_IN_SECONDS
      });
      respond();
    } else {
      var err = new Error('Failed to login');
      err.name = 'FailedLoginError';
      respond(err);
    }
  });
  socket.on('loginWithTenDayExp', function (userDetails, respond) {
    if (allowedUsers[userDetails.username]) {
      userDetails.exp = Math.round(Date.now() / 1000) + TEN_DAYS_IN_SECONDS;
      socket.setAuthToken(userDetails);
      respond();
    } else {
      var err = new Error('Failed to login');
      err.name = 'FailedLoginError';
      respond(err);
    }
  });
  socket.on('loginWithTenDayExpAndExpiry', function (userDetails, respond) {
    if (allowedUsers[userDetails.username]) {
      userDetails.exp = Math.round(Date.now() / 1000) + TEN_DAYS_IN_SECONDS;
      socket.setAuthToken(userDetails, {
        expiresIn: TEN_DAYS_IN_SECONDS * 100 // 1000 days
      });
      respond();
    } else {
      var err = new Error('Failed to login');
      err.name = 'FailedLoginError';
      respond(err);
    }
  });
  socket.on('loginWithIssAndIssuer', function (userDetails, respond) {
    if (allowedUsers[userDetails.username]) {
      userDetails.iss = 'foo';
      socket.setAuthToken(userDetails, {
        issuer: 'bar'
      });
      respond();
    } else {
      var err = new Error('Failed to login');
      err.name = 'FailedLoginError';
      respond(err);
    }
  });
  socket.on('setAuthKey', function (newAuthKey, respond) {
    server.signatureKey = newAuthKey;
    server.verificationKey = newAuthKey;
    respond();
  });
};

var destroyTestCase = function (next) {
  if (client) {
    client.on('error', function (err) {});

    if (client.state !== client.CLOSED) {
      client.once('close', function () {
        client.removeAllListeners('close');
        client.removeAllListeners('connectAbort');
        client.removeAllListeners('disconnect');
        next();
      });
      client.disconnect();
    } else {
      next();
    }
  } else {
    next();
  }
};

describe('Integration tests', function () {
  beforeEach('Run the server before start', function (done) {
    clientOptions = {
      hostname: '127.0.0.1',
      multiplex: false,
      port: portNumber
    };
    serverOptions = {
      authKey: 'testkey',
      wsEngine: WS_ENGINE
    };

    server = socketClusterServer.listen(portNumber, serverOptions);
    server.on('connection', connectionHandler);

    server.addMiddleware(server.MIDDLEWARE_AUTHENTICATE, function (req, next) {
      if (req.authToken.username === 'alice') {
        var err = new Error('Blocked by MIDDLEWARE_AUTHENTICATE');
        err.name = 'AuthenticateMiddlewareError';
        next(err);
      } else {
        next();
      }
    });

    server.on('ready', function () {
      done();
    });
  });

  afterEach('Shut down client after each test', function (done) {
    server.close();
    portNumber++;
    destroyTestCase(function () {
      global.localStorage.removeItem('socketCluster.authToken');
      done();
    });
  });

  describe('Socket authentication', function () {
    it('Should not send back error if JWT is not provided in handshake', function (done) {
      client = socketCluster.connect(clientOptions);
      client.once('connect', function (status) {
        assert.equal(status.authError === undefined, true);
        done();
      });
    });

    it('Should be authenticated on connect if previous JWT token is present', function (done) {
      client = socketCluster.connect(clientOptions);
      client.once('connect', function (statusA) {
        client.emit('login', {username: 'bob'});
        client.once('authenticate', function (state) {
          assert.equal(client.authState, 'authenticated');

          client.once('disconnect', function () {
            client.once('connect', function (statusB) {
              assert.equal(statusB.isAuthenticated, true);
              assert.equal(statusB.authError === undefined, true);
              done();
            });

            client.connect();
          });

          client.disconnect();
        });
      });
    });

    it('Should send back error if JWT is invalid during handshake', function (done) {
      global.localStorage.setItem('socketCluster.authToken', validSignedAuthTokenBob);

      client = socketCluster.connect(clientOptions);
      client.once('connect', function (statusA) {
        // Change the setAuthKey to invalidate the current token.
        client.emit('setAuthKey', 'differentAuthKey', function (err) {
          assert.equal(err == null, true);

          client.once('disconnect', function () {
            client.once('connect', function (statusB) {
              assert.equal(statusB.isAuthenticated, false);
              assert.notEqual(statusB.authError, null);
              assert.equal(statusB.authError.name, 'AuthTokenInvalidError');
              done();
            });

            client.connect();
          });

          client.disconnect();
        });
      });
    });

    it('Should allow switching between users', function (done) {
      global.localStorage.setItem('socketCluster.authToken', validSignedAuthTokenBob);

      var authenticateEvents = [];
      var deauthenticateEvents = [];
      var authenticationStateChangeEvents = [];
      var authStateChangeEvents = [];

      server.on('authenticationStateChange', function (socket, stateChangeData) {
        authenticationStateChangeEvents.push({
          socket: socket,
          stateChangeData: stateChangeData
        });
      });

      server.on('connection', function (socket) {
        socket.on('authenticate', function (authToken) {
          authenticateEvents.push(authToken);
        });
        socket.on('deauthenticate', function (oldAuthToken) {
          deauthenticateEvents.push(oldAuthToken);
        });
        socket.on('authStateChange', function (stateChangeData) {
          authStateChangeEvents.push(stateChangeData);
        });
      });

      var clientSocketId;
      client = socketCluster.connect(clientOptions);
      client.once('connect', function (statusA) {
        clientSocketId = client.id;
        client.emit('login', {username: 'alice'});
      });

      setTimeout(function () {
        assert.equal(deauthenticateEvents.length, 0);
        assert.equal(authenticateEvents.length, 2);
        assert.equal(authenticateEvents[0].username, 'bob');
        assert.equal(authenticateEvents[1].username, 'alice');

        assert.equal(authenticationStateChangeEvents.length, 1);
        assert.notEqual(authenticationStateChangeEvents[0].socket, null);
        assert.equal(authenticationStateChangeEvents[0].socket.id, clientSocketId);
        assert.equal(authenticationStateChangeEvents[0].stateChangeData.oldState, 'unauthenticated');
        assert.equal(authenticationStateChangeEvents[0].stateChangeData.newState, 'authenticated');
        assert.notEqual(authenticationStateChangeEvents[0].stateChangeData.authToken, null);
        assert.equal(authenticationStateChangeEvents[0].stateChangeData.authToken.username, 'bob');

        assert.equal(authStateChangeEvents.length, 1);
        assert.equal(authStateChangeEvents[0].oldState, 'unauthenticated');
        assert.equal(authStateChangeEvents[0].newState, 'authenticated');
        assert.notEqual(authStateChangeEvents[0].authToken, null);
        assert.equal(authStateChangeEvents[0].authToken.username, 'bob');

        done();
      }, 100);
    });

    it('Should emit correct events/data when socket is deauthenticated', function (done) {
      global.localStorage.setItem('socketCluster.authToken', validSignedAuthTokenBob);

      var authenticationStateChangeEvents = [];
      var authStateChangeEvents = [];

      server.on('authenticationStateChange', function (socket, stateChangeData) {
        authenticationStateChangeEvents.push({
          socket: socket,
          stateChangeData: stateChangeData
        });
      });

      client = socketCluster.connect(clientOptions);
      client.once('connect', function (statusA) {
        client.deauthenticate();
      });

      server.on('connection', function (socket) {
        var initialAuthToken = socket.authToken;

        socket.on('authStateChange', function (stateChangeData) {
          authStateChangeEvents.push(stateChangeData);
        });

        socket.on('deauthenticate', function (oldToken) {
          assert.equal(oldToken, initialAuthToken);

          assert.equal(authStateChangeEvents.length, 2);
          assert.equal(authStateChangeEvents[0].oldState, 'unauthenticated');
          assert.equal(authStateChangeEvents[0].newState, 'authenticated');
          assert.notEqual(authStateChangeEvents[0].authToken, null);
          assert.equal(authStateChangeEvents[0].authToken.username, 'bob');
          assert.equal(authStateChangeEvents[1].oldState, 'authenticated');
          assert.equal(authStateChangeEvents[1].newState, 'unauthenticated');
          assert.equal(authStateChangeEvents[1].authToken, null);

          assert.equal(authenticationStateChangeEvents.length, 2);
          assert.notEqual(authenticationStateChangeEvents[0].stateChangeData, null);
          assert.equal(authenticationStateChangeEvents[0].stateChangeData.oldState, 'unauthenticated');
          assert.equal(authenticationStateChangeEvents[0].stateChangeData.newState, 'authenticated');
          assert.notEqual(authenticationStateChangeEvents[0].stateChangeData.authToken, null);
          assert.equal(authenticationStateChangeEvents[0].stateChangeData.authToken.username, 'bob');
          assert.notEqual(authenticationStateChangeEvents[1].stateChangeData, null);
          assert.equal(authenticationStateChangeEvents[1].stateChangeData.oldState, 'authenticated');
          assert.equal(authenticationStateChangeEvents[1].stateChangeData.newState, 'unauthenticated');
          assert.equal(authenticationStateChangeEvents[1].stateChangeData.authToken, null);
          done();
        });
      });
    });

    it('Should not authenticate the client if MIDDLEWARE_AUTHENTICATE blocks the authentication', function (done) {
      global.localStorage.setItem('socketCluster.authToken', validSignedAuthTokenAlice);

      client = socketCluster.connect(clientOptions);
      // The previous test authenticated us as 'alice', so that token will be passed to the server as
      // part of the handshake.
      client.once('connect', function (statusB) {
        // Any token containing the username 'alice' should be blocked by the MIDDLEWARE_AUTHENTICATE middleware.
        // This will only affects token-based authentication, not the credentials-based login event.
        assert.equal(statusB.isAuthenticated, false);
        assert.notEqual(statusB.authError, null);
        assert.equal(statusB.authError.name, 'AuthenticateMiddlewareError');
        done();
      });
    });

    it('Token should be available inside login callback if token engine signing is synchronous', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE,
        authSignAsync: false
      });
      server.on('connection', connectionHandler);
      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });
        client.once('connect', function (statusA) {
          client.emit('login', {username: 'bob'}, function (err) {
            assert.equal(client.authState, 'authenticated');
            assert.notEqual(client.authToken, null);
            assert.equal(client.authToken.username, 'bob');
            done();
          });
        });
      });
    });

    it('If token engine signing is asynchronous, authentication can be captured using the authenticate event', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE,
        authSignAsync: true
      });
      server.on('connection', connectionHandler);
      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });
        client.once('connect', function (statusA) {
          client.emit('login', {username: 'bob'});
          client.on('authenticate', function (newSignedToken) {
            assert.equal(client.authState, 'authenticated');
            assert.notEqual(client.authToken, null);
            assert.equal(client.authToken.username, 'bob');
            done();
          });
        });
      });
    });

    it('Should still work if token verification is asynchronous', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE,
        authVerifyAsync: false
      });
      server.on('connection', connectionHandler);
      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });
        client.once('connect', function (statusA) {
          client.emit('login', {username: 'bob'});
          client.once('authenticate', function (newSignedToken) {
            client.once('disconnect', function () {
              client.once('connect', function (statusB) {
                assert.equal(statusB.isAuthenticated, true);
                assert.notEqual(client.authToken, null);
                assert.equal(client.authToken.username, 'bob');
                done();
              });
              client.connect();
            });
            client.disconnect();
          });
        });
      });
    });

    it('Should set the correct expiry when using expiresIn option when creating a JWT with socket.setAuthToken', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE,
        authVerifyAsync: false
      });
      server.on('connection', connectionHandler);
      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });
        client.once('connect', function (statusA) {
          client.once('authenticate', function (newSignedToken) {
            assert.notEqual(client.authToken, null);
            assert.notEqual(client.authToken.exp, null);
            var dateMillisecondsInTenDays = Date.now() + TEN_DAYS_IN_SECONDS * 1000;
            var dateDifference = Math.abs(dateMillisecondsInTenDays - client.authToken.exp * 1000);
            // Expiry must be accurate within 1000 milliseconds.
            assert.equal(dateDifference < 1000, true);
            done();
          });
          client.emit('loginWithTenDayExpiry', {username: 'bob'});
        });
      });
    });

    it('Should set the correct expiry when adding exp claim when creating a JWT with socket.setAuthToken', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE,
        authVerifyAsync: false
      });
      server.on('connection', connectionHandler);
      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });
        client.once('connect', function (statusA) {
          client.once('authenticate', function (newSignedToken) {
            assert.notEqual(client.authToken, null);
            assert.notEqual(client.authToken.exp, null);
            var dateMillisecondsInTenDays = Date.now() + TEN_DAYS_IN_SECONDS * 1000;
            var dateDifference = Math.abs(dateMillisecondsInTenDays - client.authToken.exp * 1000);
            // Expiry must be accurate within 1000 milliseconds.
            assert.equal(dateDifference < 1000, true);
            done();
          });
          client.emit('loginWithTenDayExp', {username: 'bob'});
        });
      });
    });

    it('The exp claim should have priority over expiresIn option when using socket.setAuthToken', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE,
        authVerifyAsync: false
      });
      server.on('connection', connectionHandler);
      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });
        client.once('connect', function (statusA) {
          client.once('authenticate', function (newSignedToken) {
            assert.notEqual(client.authToken, null);
            assert.notEqual(client.authToken.exp, null);
            var dateMillisecondsInTenDays = Date.now() + TEN_DAYS_IN_SECONDS * 1000;
            var dateDifference = Math.abs(dateMillisecondsInTenDays - client.authToken.exp * 1000);
            // Expiry must be accurate within 1000 milliseconds.
            assert.equal(dateDifference < 1000, true);
            done();
          });
          client.emit('loginWithTenDayExpAndExpiry', {username: 'bob'});
        });
      });
    });

    it('Should send back error if socket.setAuthToken tries to set both iss claim and issuer option', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE,
        authVerifyAsync: false
      });
      var warningMap = {};

      server.on('connection', connectionHandler);
      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });
        client.once('connect', function (statusA) {
          client.once('authenticate', function (newSignedToken) {
            throw new Error('Should not pass authentication because the signature should fail');
          });
          server.on('warning', function (warning) {
            assert.notEqual(warning, null);
            warningMap[warning.name] = warning;
          });
          client.once('error', function (err) {
            assert.notEqual(err, null);
            assert.equal(err.name, 'SocketProtocolError');
          });
          client.emit('loginWithIssAndIssuer', {username: 'bob'});
          setTimeout(function () {
            server.removeAllListeners('warning');
            assert.notEqual(warningMap['SocketProtocolError'], null);
            done();
          }, 1000);
        });
      });
    });

    it('Should trigger an authTokenSigned event and socket.signedAuthToken should be set after calling the socket.setAuthToken method', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE,
        authSignAsync: true
      });

      var authTokenSignedEventEmitted = false;

      server.on('connection', function (socket) {
        socket.on('authTokenSigned', function (signedAuthToken) {
          authTokenSignedEventEmitted = true;
          assert.notEqual(signedAuthToken, null);
          assert.equal(signedAuthToken, socket.signedAuthToken);
        });
        socket.on('login', function (userDetails, respond) {
          if (allowedUsers[userDetails.username]) {
            socket.setAuthToken(userDetails, {async: true});
            respond();
          } else {
            var err = new Error('Failed to login');
            err.name = 'FailedLoginError';
            respond(err);
          }
        });
      });

      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });
        client.once('connect', function (statusA) {
          client.emit('login', {username: 'bob'});
        });
        setTimeout(function () {
          assert.equal(authTokenSignedEventEmitted, true);
          done();
        }, 100);
      });
    });

    it('The verifyToken method of the authEngine receives correct params', function (done) {
      global.localStorage.setItem('socketCluster.authToken', validSignedAuthTokenBob);

      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE
      });
      server.setAuthEngine({
        verifyToken: function (signedAuthToken, verificationKey, verificationOptions, callback) {
          setTimeout(function () {
            assert.equal(signedAuthToken, validSignedAuthTokenBob);
            assert.equal(verificationKey, serverOptions.authKey);
            assert.notEqual(verificationOptions, null);
            assert.notEqual(verificationOptions.socket, null);
            assert.equal(typeof callback, 'function');
            callback(null, {});
            done();
          }, 500)
        }
      });
      server.on('connection', connectionHandler);
      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });
      });
    });

    it('Should remove client data from the server when client disconnects before authentication process finished', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE
      });
      server.setAuthEngine({
        verifyToken: function (signedAuthToken, verificationKey, verificationOptions, callback) {
          setTimeout(function () {
            callback(null, {});
          }, 500)
        }
      });
      server.on('connection', connectionHandler);
      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });
        var serverSocket;
        server.on('handshake', function (socket) {
          serverSocket = socket;
        });
        setTimeout(function () {
          assert.equal(server.clientsCount, 0);
          assert.equal(server.pendingClientsCount, 1);
          assert.notEqual(serverSocket, null);
          assert.equal(Object.keys(server.pendingClients)[0], serverSocket.id);
          client.disconnect();
        }, 100);
        setTimeout(function () {
          assert.equal(Object.keys(server.clients).length, 0);
          assert.equal(server.clientsCount, 0);
          assert.equal(server.pendingClientsCount, 0);
          assert.equal(JSON.stringify(server.pendingClients), '{}');
          done();
        }, 1000);
      });
    });
  });

  describe('Socket handshake', function () {
    it('Exchange is attached to socket before the handshake event is triggered', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE
      });

      server.on('connection', connectionHandler);

      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });

        server.once('handshake', function (socket) {
          assert.notEqual(socket.exchange, null);
        });

        setTimeout(function () {
          done();
        }, 300);
      });
    });

    it('Should close the connection if the client tries to send a message before the handshake', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE
      });

      server.on('connection', connectionHandler);

      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });
        client.on('error', function () {});

        client.transport.socket.onopen = function () {
          client.transport.socket.send(Buffer.alloc(0));
        };

        var closeCode;
        client.on('close', function (code, reason) {
          closeCode = code;
        });

        setTimeout(function () {
          assert.equal(closeCode, 4009);
          done();
        }, 300);
      });
    });

    it('Should not close the connection if the client tries to send a message before the handshake and strictHandshake is false', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE,
        strictHandshake: false
      });

      server.on('connection', connectionHandler);

      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });
        client.on('error', function () {});

        client.transport.socket.onopen = function () {
          client.transport.socket.send(Buffer.alloc(0));
        };

        var closeCode = null;
        client.on('close', function (code, reason) {
          closeCode = code;
        });

        setTimeout(function () {
          assert.equal(closeCode, null);
          done();
        }, 300);
      });
    });
  });

  describe('Socket connection', function () {
    it('Server-side socket connect event and server connection event should trigger', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE
      });

      var connectionEmitted = false;
      var connectionStatus;

      server.on('connection', connectionHandler);
      server.once('connection', function (socket, status) {
        connectionEmitted = true;
        connectionStatus = status;
        // Modify the status object and make sure that it doesn't get modified
        // on the client.
        status.foo = 123;
      });
      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });

        var connectEmitted = false;
        var _connectEmitted = false;
        var connectStatus;
        var socketId;

        server.once('handshake', function (socket) {
          socket.once('connect', function (status) {
            socketId = socket.id;
            connectEmitted = true;
            connectStatus = status;
          });
          socket.once('_connect', function () {
            _connectEmitted = true;
          });
        });

        var clientConnectEmitted = false;
        var clientConnectStatus = false;

        client.once('connect', function (status) {
          clientConnectEmitted = true;
          clientConnectStatus = status;
        });

        setTimeout(function () {
          assert.equal(connectEmitted, true);
          assert.equal(_connectEmitted, true);
          assert.equal(connectionEmitted, true);
          assert.equal(clientConnectEmitted, true);

          assert.notEqual(connectionStatus, null);
          assert.equal(connectionStatus.id, socketId);
          assert.equal(connectionStatus.pingTimeout, server.pingTimeout);
          assert.equal(connectionStatus.authError, null);
          assert.equal(connectionStatus.isAuthenticated, false);

          assert.notEqual(connectStatus, null);
          assert.equal(connectStatus.id, socketId);
          assert.equal(connectStatus.pingTimeout, server.pingTimeout);
          assert.equal(connectStatus.authError, null);
          assert.equal(connectStatus.isAuthenticated, false);

          assert.notEqual(clientConnectStatus, null);
          assert.equal(clientConnectStatus.id, socketId);
          assert.equal(clientConnectStatus.pingTimeout, server.pingTimeout);
          assert.equal(clientConnectStatus.authError, null);
          assert.equal(clientConnectStatus.isAuthenticated, false);
          assert.equal(clientConnectStatus.foo, null);
          // Client socket status should be a clone of server socket status; not
          // a reference to the same object.
          assert.notEqual(clientConnectStatus.foo, connectStatus.foo);

          done();
        }, 300);
      });
    });
  });

  describe('Socket disconnection', function () {
    it('Server-side socket disconnect event should not trigger if the socket did not complete the handshake; instead, it should trigger connectAbort', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE
      });
      server.setAuthEngine({
        verifyToken: function (signedAuthToken, verificationKey, verificationOptions, callback) {
          setTimeout(function () {
            callback(null, {});
          }, 500)
        }
      });
      server.on('connection', connectionHandler);
      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });

        var socketDisconnected = false;
        var socketDisconnectedBeforeConnect = false;
        var clientSocketAborted = false;

        var connectionOnServer = false;

        server.once('connection', function () {
          connectionOnServer = true;
        });

        server.once('handshake', function (socket) {
          assert.equal(server.pendingClientsCount, 1);
          assert.notEqual(server.pendingClients[socket.id], null);
          socket.once('disconnect', function () {
            if (!connectionOnServer) {
              socketDisconnectedBeforeConnect = true;
            }
            socketDisconnected = true;
          });
          socket.once('connectAbort', function () {
            clientSocketAborted = true;
          });
        });

        var serverDisconnected = false;
        var serverSocketAborted = false;

        server.once('disconnection', function () {
          serverDisconnected = true;
        });

        server.once('connectionAbort', function () {
          serverSocketAborted = true;
        });

        setTimeout(function () {
          client.disconnect();
        }, 100);
        setTimeout(function () {
          assert.equal(socketDisconnected, false);
          assert.equal(socketDisconnectedBeforeConnect, false);
          assert.equal(clientSocketAborted, true);
          assert.equal(serverSocketAborted, true);
          assert.equal(serverDisconnected, false);
          done();
        }, 1000);
      });
    });

    it('Server-side socket disconnect event should trigger if the socket completed the handshake (not connectAbort)', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE
      });
      server.setAuthEngine({
        verifyToken: function (signedAuthToken, verificationKey, verificationOptions, callback) {
          setTimeout(function () {
            callback(null, {});
          }, 10)
        }
      });
      server.on('connection', connectionHandler);
      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });

        var socketDisconnected = false;
        var socketDisconnectedBeforeConnect = false;
        var clientSocketAborted = false;

        var connectionOnServer = false;

        server.once('connection', function () {
          connectionOnServer = true;
        });

        server.once('handshake', function (socket) {
          assert.equal(server.pendingClientsCount, 1);
          assert.notEqual(server.pendingClients[socket.id], null);
          socket.once('disconnect', function () {
            if (!connectionOnServer) {
              socketDisconnectedBeforeConnect = true;
            }
            socketDisconnected = true;
          });
          socket.once('connectAbort', function () {
            clientSocketAborted = true;
          });
        });

        var serverDisconnected = false;
        var serverSocketAborted = false;

        server.once('disconnection', function () {
          serverDisconnected = true;
        });

        server.once('connectionAbort', function () {
          serverSocketAborted = true;
        });

        setTimeout(function () {
          client.disconnect();
        }, 200);
        setTimeout(function () {
          assert.equal(socketDisconnectedBeforeConnect, false);
          assert.equal(socketDisconnected, true);
          assert.equal(clientSocketAborted, false);
          assert.equal(serverDisconnected, true);
          assert.equal(serverSocketAborted, false);
          done();
        }, 1000);
      });
    });

    it('The close event should trigger when the socket loses the connection before the handshake', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE
      });
      server.setAuthEngine({
        verifyToken: function (signedAuthToken, verificationKey, verificationOptions, callback) {
          setTimeout(function () {
            callback(null, {});
          }, 500)
        }
      });
      server.on('connection', connectionHandler);
      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });

        var serverSocketClosed = false;
        var serverSocketAborted = false;
        var serverClosure = false;

        server.on('handshake', function (socket) {
          socket.once('close', function () {
            serverSocketClosed = true;
          });
        });

        server.once('connectionAbort', function () {
          serverSocketAborted = true;
        });

        server.on('closure', function (socket) {
          assert.equal(socket.state, socket.CLOSED);
          serverClosure = true;
        });

        setTimeout(function () {
          client.disconnect();
        }, 100);
        setTimeout(function () {
          assert.equal(serverSocketClosed, true);
          assert.equal(serverSocketAborted, true);
          assert.equal(serverClosure, true);
          done();
        }, 1000);
      });
    });

    it('The close event should trigger when the socket loses the connection after the handshake', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE
      });
      server.setAuthEngine({
        verifyToken: function (signedAuthToken, verificationKey, verificationOptions, callback) {
          setTimeout(function () {
            callback(null, {});
          }, 0)
        }
      });
      server.on('connection', connectionHandler);
      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });

        var serverSocketClosed = false;
        var serverSocketDisconnected = false;
        var serverClosure = false;

        server.on('handshake', function (socket) {
          socket.once('close', function () {
            serverSocketClosed = true;
          });
        });

        server.once('disconnection', function () {
          serverSocketDisconnected = true;
        });

        server.on('closure', function (socket) {
          assert.equal(socket.state, socket.CLOSED);
          serverClosure = true;
        });

        setTimeout(function () {
          client.disconnect();
        }, 100);
        setTimeout(function () {
          assert.equal(serverSocketClosed, true);
          assert.equal(serverSocketDisconnected, true);
          assert.equal(serverClosure, true);
          done();
        }, 300);
      });
    });
  });

  describe('Socket pub/sub', function () {
    it('Should support subscription batching', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE
      });
      server.on('connection', function (socket) {
        connectionHandler(socket);
        var isFirstMessage = true;
        socket.on('message', function (rawMessage) {
          if (isFirstMessage) {
            var data = JSON.parse(rawMessage);
            // All 20 subscriptions should arrive as a single message.
            assert.equal(data.length, 20);
            isFirstMessage = false;
          }
        });
      });

      var subscribeMiddlewareCounter = 0;
      // Each subscription should pass through the middleware individually, even
      // though they were sent as a batch/array.
      server.addMiddleware(server.MIDDLEWARE_SUBSCRIBE, function (req, next) {
        subscribeMiddlewareCounter++;
        assert.equal(req.channel.indexOf('my-channel-'), 0);
        if (req.channel === 'my-channel-10') {
          assert.equal(JSON.stringify(req.data), JSON.stringify({foo: 123}));
        } else if (req.channel === 'my-channel-12') {
          // Block my-channel-12
          var err = new Error('You cannot subscribe to channel 12');
          err.name = 'UnauthorizedSubscribeError';
          next(err);
          return;
        }
        next();
      });

      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });
        var channelList = [];
        for (var i = 0; i < 20; i++) {
          var subscribeOptions = {
            batch: true
          };
          if (i === 10) {
            subscribeOptions.data = {foo: 123};
          }
          channelList.push(
            client.subscribe('my-channel-' + i, subscribeOptions)
          );
        }
        channelList[12].on('subscribe', function (err) {
          throw new Error('The my-channel-12 channel should have been blocked by MIDDLEWARE_SUBSCRIBE');
        });
        channelList[12].on('subscribeFail', function (err) {
          assert.notEqual(err, null);
          assert.equal(err.name, 'UnauthorizedSubscribeError');
        });
        channelList[19].watch(function (data) {
          assert.equal(data, 'Hello!');
          assert.equal(subscribeMiddlewareCounter, 20);
          done();
        });
        channelList[0].on('subscribe', function () {
          client.publish('my-channel-19', 'Hello!');
        });
      });
    });

    it('Client should not be able to subscribe to a channel before the handshake has completed', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE
      });
      server.setAuthEngine({
        verifyToken: function (signedAuthToken, verificationKey, verificationOptions, callback) {
          setTimeout(function () {
            callback(null, {});
          }, 500)
        }
      });
      server.on('connection', connectionHandler);
      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });

        client.on('error', function () {});

        var isSubscribed = false;
        var error;

        server.on('subscription', function (socket, channel) {
          isSubscribed = true;
        });

        // Hack to capture the error without relying on the standard client flow.
        client.transport._callbackMap[2] = {
          event: '#subscribe',
          data: {"channel":"someChannel"},
          callback: function (err) {
            error = err;
          }
        };

        // Trick the server by sending a fake subscribe before the handshake is done.
        client.transport.socket.on('open', function () {
          client.send('{"event":"#subscribe","data":{"channel":"someChannel"},"cid":2}');
        });

        setTimeout(function () {
          assert.equal(isSubscribed, false);
          assert.notEqual(error, null);
          assert.equal(error.name, 'BadConnectionError');
          done();
        }, 1000);
      });
    });

    it('Server should be able to handle invalid #subscribe and #unsubscribe and #publish packets without crashing', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE
      });

      server.on('connection', connectionHandler);

      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });

        var nullInChannelArrayError;
        var objectAsChannelNameError;
        var nullChannelNameError;
        var nullUnsubscribeError;

        var undefinedPublishError;
        var objectAsChannelNamePublishError;
        var nullPublishError;

        // Hacks to capture the errors without relying on the standard client flow.
        client.transport._callbackMap[2] = {
          event: '#subscribe',
          data: [null],
          callback: function (err) {
            nullInChannelArrayError = err;
          }
        };
        client.transport._callbackMap[3] = {
          event: '#subscribe',
          data: {"channel": {"hello": 123}},
          callback: function (err) {
            objectAsChannelNameError = err;
          }
        };
        client.transport._callbackMap[4] = {
          event: '#subscribe',
          data: null,
          callback: function (err) {
            nullChannelNameError = err;
          }
        };
        client.transport._callbackMap[5] = {
          event: '#unsubscribe',
          data: [null],
          callback: function (err) {
            nullUnsubscribeError = err;
          }
        };
        client.transport._callbackMap[6] = {
          event: '#publish',
          data: null,
          callback: function (err) {
            undefinedPublishError = err;
          }
        };
        client.transport._callbackMap[7] = {
          event: '#publish',
          data: {"channel": {"hello": 123}},
          callback: function (err) {
            objectAsChannelNamePublishError = err;
          }
        };
        client.transport._callbackMap[8] = {
          event: '#publish',
          data: {"channel": null},
          callback: function (err) {
            nullPublishError = err;
          }
        };

        // Trick the server by sending a fake subscribe before the handshake is done.
        client.on('connect', function () {
          client.send('{"event":"#subscribe","data":[null],"cid":2}');
          client.send('{"event":"#subscribe","data":{"channel":{"hello":123}},"cid":3}');
          client.send('{"event":"#subscribe","data":null,"cid":4}');
          client.send('{"event":"#unsubscribe","data":[null],"cid":5}');
          client.send('{"event":"#publish","data":null,"cid":6}');
          client.send('{"event":"#publish","data":{"channel":{"hello":123}},"cid":7}');
          client.send('{"event":"#publish","data":{"channel":null},"cid":8}');
        });

        setTimeout(function () {
          assert.notEqual(nullInChannelArrayError, null);
          // console.log('nullInChannelArrayError:', nullInChannelArrayError);
          assert.notEqual(objectAsChannelNameError, null);
          // console.log('objectAsChannelNameError:', objectAsChannelNameError);
          assert.notEqual(nullChannelNameError, null);
          // console.log('nullChannelNameError:', nullChannelNameError);
          assert.notEqual(nullUnsubscribeError, null);
          // console.log('nullUnsubscribeError:', nullUnsubscribeError);
          assert.notEqual(undefinedPublishError, null);
          // console.log('undefinedPublishError:', undefinedPublishError);
          assert.notEqual(objectAsChannelNamePublishError, null);
          // console.log('objectAsChannelNamePublishError:', objectAsChannelNamePublishError);
          assert.notEqual(nullPublishError, null);
          // console.log('nullPublishError:', nullPublishError);

          done();
        }, 300);
      });
    });

    it('When default SCSimpleBroker broker engine is used, unsubscribe event should trigger before disconnect event', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE
      });

      var eventList = [];

      server.on('connection', function (socket) {
        socket.on('unsubscribe', function (channel) {
          eventList.push({
            type: 'unsubscribe',
            channel: channel
          });
        });
        socket.on('disconnect', function (code, reason) {
          eventList.push({
            type: 'disconnect',
            code: code,
            reason: reason
          });
          assert.equal(eventList[0].type, 'unsubscribe');
          assert.equal(eventList[0].channel, 'foo');
          assert.equal(eventList[1].type, 'disconnect');

          done();
        });
      });

      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });

        client.subscribe('foo').on('subscribe', function () {
          setTimeout(function () {
            client.disconnect();
          }, 200);
        });
      });
    });

    it('When disconnecting a socket, the unsubscribe event should trigger before disconnect event (accounting for delayed unsubscribe by brokerEngine)', function (done) {
      portNumber++;
      var customBrokerEngine = new SCSimpleBroker();
      var defaultUnsubscribeSocket = customBrokerEngine.unsubscribeSocket;
      customBrokerEngine.unsubscribeSocket = function (socket, channel, callback) {
        defaultUnsubscribeSocket.call(this, socket, channel, function () {
          setTimeout(function () {
            callback && callback();
          }, 100);
        });
      };

      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE,
        brokerEngine: customBrokerEngine
      });

      var eventList = [];

      server.on('connection', function (socket) {
        socket.on('unsubscribe', function (channel) {
          eventList.push({
            type: 'unsubscribe',
            channel: channel
          });
        });
        socket.on('disconnect', function (code, reason) {
          eventList.push({
            type: 'disconnect',
            code: code,
            reason: reason
          });

          assert.equal(eventList[0].type, 'unsubscribe');
          assert.equal(eventList[0].channel, 'foo');
          assert.equal(eventList[1].type, 'disconnect');

          done();
        });
      });

      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });
        client.on('error', function () {});

        client.subscribe('foo').on('subscribe', function () {
          setTimeout(function () {
            client.disconnect();
          }, 200);
        });
      });
    });

    it('Socket should emit an error when trying to unsubscribe to a channel which it is not subscribed to', function (done) {
      portNumber++;

      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE
      });

      var errorList = [];

      server.on('connection', function (socket) {
        socket.on('error', function (err) {
          errorList.push(err);
        });
      });

      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });

        client.emit('#unsubscribe', 'bar');

        setTimeout(function () {
          assert.equal(errorList.length, 1);
          assert.equal(errorList[0].name, 'BrokerError');
          done();
        }, 100);
      });
    });

    it('Socket should not receive messages from a channel which it has only just unsubscribed from (accounting for delayed unsubscribe by brokerEngine)', function (done) {
      portNumber++;
      var customBrokerEngine = new SCSimpleBroker();
      var defaultUnsubscribeSocket = customBrokerEngine.unsubscribeSocket;
      customBrokerEngine.unsubscribeSocket = function (socket, channel, callback) {
        defaultUnsubscribeSocket.call(this, socket, channel, function () {
          setTimeout(function () {
            callback && callback();
          }, 300);
        });
      };

      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE,
        brokerEngine: customBrokerEngine
      });

      server.on('connection', function (socket) {
        socket.on('unsubscribe', function (channelName) {
          if (channelName === 'foo') {
            server.exchange.publish('foo', 'hello');
          }
        });
      });

      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });
        // Stub the isSubscribed method so that it always returns true.
        // That way the client will always invoke watchers whenever
        // it receives a #publish event.
        client.isSubscribed = function () { return true; };

        var messageList = [];

        var fooChannel = client.subscribe('foo');

        client.watch('foo', function (data) {
          messageList.push(data);
        });

        fooChannel.on('subscribe', function () {
          client.emit('#unsubscribe', 'foo');
        });

        setTimeout(function () {
          assert.equal(messageList.length, 0);
          done();
        }, 200);
      });
    });

    it('Socket channelSubscriptions and channelSubscriptionsCount should update when socket.kickOut(channel) is called', function (done) {
      portNumber++;

      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE
      });

      var errorList = [];
      var serverSocket;
      var wasKickOutCalled = false;

      server.on('connection', function (socket) {
        serverSocket = socket;
        socket.on('error', function (err) {
          errorList.push(err);
        });
        socket.on('subscribe', function (channelName) {
          if (channelName === 'foo') {
            setTimeout(function () {
              wasKickOutCalled = true;
              socket.kickOut('foo', 'Socket was kicked out of the channel');
            }, 50);
          }
        });
      });

      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });

        client.subscribe('foo');

        setTimeout(function () {
          assert.equal(errorList.length, 0);
          assert.equal(wasKickOutCalled, true);
          assert.equal(serverSocket.channelSubscriptionsCount, 0);
          assert.equal(Object.keys(serverSocket.channelSubscriptions).length, 0);
          done();
        }, 100);
      });
    });

    it('Socket channelSubscriptions and channelSubscriptionsCount should update when socket.kickOut() is called without arguments', function (done) {
      portNumber++;

      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE
      });

      var errorList = [];
      var serverSocket;
      var wasKickOutCalled = false;

      server.on('connection', function (socket) {
        serverSocket = socket;
        socket.on('error', function (err) {
          errorList.push(err);
        });
        socket.on('subscribe', function (channelName) {
          if (socket.channelSubscriptionsCount === 2) {
            setTimeout(function () {
              wasKickOutCalled = true;
              socket.kickOut();
            }, 50);
          }
        });
      });

      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });

        client.subscribe('foo');
        client.subscribe('bar');

        setTimeout(function () {
          assert.equal(errorList.length, 0);
          assert.equal(wasKickOutCalled, true);
          assert.equal(serverSocket.channelSubscriptionsCount, 0);
          assert.equal(Object.keys(serverSocket.channelSubscriptions).length, 0);
          done();
        }, 100);
      });
    });
  });

  describe('Socket destruction', function () {
    it('Server socket destroy should disconnect the socket', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE
      });

      server.on('connection', function (socket) {
        setTimeout(function () {
          socket.destroy(1000, 'Custom reason');
        }, 100);
      });
      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });
        client.on('disconnect', function (code, reason) {
          assert.equal(code, 1000);
          assert.equal(reason, 'Custom reason');
          assert.equal(server.clientsCount, 0);
          assert.equal(server.pendingClientsCount, 0);
          done();
        });
      });
    });

    it('Server socket destroy should set the active property on the socket to false', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE
      });

      var serverSocket;

      server.on('connection', function (socket) {
        serverSocket = socket;
        assert.equal(socket.active, true);
        setTimeout(function () {
          socket.destroy();
        }, 100);
      });
      server.on('ready', function () {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });
        client.on('disconnect', function (code, reason) {
          assert.equal(serverSocket.active, false);
          done();
        });
      });
    });
  });

  describe('Socket Ping/pong', function () {
    describe('When when pingTimeoutDisabled is not set (false)', function () {
      beforeEach('Launch server with ping options before start', function (done) {
        portNumber++;
        // Intentionally make pingInterval higher than pingTimeout, that
        // way the client will never receive a ping or send back a pong.
        server = socketClusterServer.listen(portNumber, {
          authKey: serverOptions.authKey,
          wsEngine: WS_ENGINE,
          pingInterval: 2000,
          pingTimeout: 500
        });
        server.on('ready', function () {
          done();
        });
      });

      afterEach('Shut down server afterwards', function (done) {
        destroyTestCase(function () {
          server.close();
          done();
        });
      });

      it('Should disconnect socket if server does not receive a pong from client before timeout', function (done) {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });

        var serverWarning = null;
        server.on('warning', function (err) {
          serverWarning = err;
        });

        var serverDisconnectionCode = null;
        server.on('disconnection', function (socket, code) {
          serverDisconnectionCode = code;
        });

        var clientError = null;
        client.on('error', function (err) {
          clientError = err;
        });

        var clientDisconnectCode = null;
        client.on('disconnect', function (code) {
          clientDisconnectCode = code;
        });

        setTimeout(function () {
          assert.notEqual(clientError, null);
          assert.equal(clientError.name, 'SocketProtocolError');
          assert.equal(clientDisconnectCode, 4000);

          assert.notEqual(serverWarning, null);
          assert.equal(serverWarning.name, 'SocketProtocolError');
          assert.equal(serverDisconnectionCode, 4001);
          done();
        }, 1000);
      });
    });

    describe('When when pingTimeoutDisabled is true', function () {
      beforeEach('Launch server with ping options before start', function (done) {
        portNumber++;
        // Intentionally make pingInterval higher than pingTimeout, that
        // way the client will never receive a ping or send back a pong.
        server = socketClusterServer.listen(portNumber, {
          authKey: serverOptions.authKey,
          wsEngine: WS_ENGINE,
          pingInterval: 2000,
          pingTimeout: 500,
          pingTimeoutDisabled: true
        });
        server.on('ready', function () {
          done();
        });
      });

      afterEach('Shut down server afterwards', function (done) {
        destroyTestCase(function () {
          server.close();
          done();
        });
      });

      it('Should not disconnect socket if server does not receive a pong from client before timeout', function (done) {
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false,
          pingTimeoutDisabled: true
        });

        var serverWarning = null;
        server.on('warning', function (err) {
          serverWarning = err;
        });

        var serverDisconnectionCode = null;
        server.on('disconnection', function (socket, code) {
          serverDisconnectionCode = code;
        });

        var clientError = null;
        client.on('error', function (err) {
          clientError = err;
        });

        var clientDisconnectCode = null;
        client.on('disconnect', function (code) {
          clientDisconnectCode = code;
        });

        setTimeout(function () {
          assert.equal(clientError, null);
          assert.equal(clientDisconnectCode, null);

          assert.equal(serverWarning, null);
          assert.equal(serverDisconnectionCode, null);
          done();
        }, 1000);
      });
    });
  });

  describe('Middleware', function () {
    var middlewareFunction;
    var middlewareWasExecuted = false;

    beforeEach('Launch server without middleware before start', function (done) {
      portNumber++;
      server = socketClusterServer.listen(portNumber, {
        authKey: serverOptions.authKey,
        wsEngine: WS_ENGINE
      });
      server.on('ready', function () {
        done();
      });
    });

    afterEach('Shut down server afterwards', function (done) {
      destroyTestCase(function () {
        server.close();
        done();
      });
    });

    describe('MIDDLEWARE_AUTHENTICATE', function () {
      it('Should not run authenticate middleware if JWT token does not exist', function (done) {
        middlewareFunction = function (req, next) {
          middlewareWasExecuted = true;
          next();
        };
        server.addMiddleware(server.MIDDLEWARE_AUTHENTICATE, middlewareFunction);

        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });

        client.once('connect', function () {
          assert.notEqual(middlewareWasExecuted, true);
          done();
        });
      });

      it('Should run authenticate middleware if JWT token exists', function (done) {
        global.localStorage.setItem('socketCluster.authToken', validSignedAuthTokenBob);

        middlewareFunction = function (req, next) {
          middlewareWasExecuted = true;
          next();
        };
        server.addMiddleware(server.MIDDLEWARE_AUTHENTICATE, middlewareFunction);

        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });

        client.emit('login', {username: 'bob'});
        client.once('authenticate', function (state) {
          assert.equal(middlewareWasExecuted, true);
          done();
        });
      });
    });

    describe('MIDDLEWARE_HANDSHAKE_SC', function () {
      it('Should trigger correct events if MIDDLEWARE_HANDSHAKE_SC blocks with an error', function (done) {
        var middlewareWasExecuted = false;
        var serverWarnings = [];
        var clientErrors = [];
        var abortStatus;

        middlewareFunction = function (req, next) {
          setTimeout(function () {
            middlewareWasExecuted = true;
            var err = new Error('SC handshake failed because the server was too lazy');
            err.name = 'TooLazyHandshakeError';
            next(err);
          }, 100);
        };
        server.addMiddleware(server.MIDDLEWARE_HANDSHAKE_SC, middlewareFunction);

        server.on('warning', function (err) {
          serverWarnings.push(err);
        });

        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });

        client.on('error', function (err) {
          clientErrors.push(err);
        });

        client.once('connectAbort', function (status, reason) {
          abortStatus = status;
        });

        setTimeout(function () {
          assert.equal(middlewareWasExecuted, true);
          assert.notEqual(clientErrors[0], null);
          assert.equal(clientErrors[0].name, 'TooLazyHandshakeError');
          assert.notEqual(clientErrors[1], null);
          assert.equal(clientErrors[1].name, 'SocketProtocolError');
          assert.notEqual(serverWarnings[0], null);
          assert.equal(serverWarnings[0].name, 'TooLazyHandshakeError');
          assert.notEqual(abortStatus, null);
          done();
        }, 200);
      });

      it('Should send back default 4008 status code if MIDDLEWARE_HANDSHAKE_SC blocks without providing a status code', function (done) {
        var middlewareWasExecuted = false;
        var abortStatus;
        var abortReason;

        middlewareFunction = function (req, next) {
          setTimeout(function () {
            middlewareWasExecuted = true;
            var err = new Error('SC handshake failed because the server was too lazy');
            err.name = 'TooLazyHandshakeError';
            next(err);
          }, 100);
        };
        server.addMiddleware(server.MIDDLEWARE_HANDSHAKE_SC, middlewareFunction);

        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });
        client.on('error', function () {});

        client.once('connectAbort', function (status, reason) {
          abortStatus = status;
          abortReason = reason;
        });

        setTimeout(function () {
          assert.equal(middlewareWasExecuted, true);
          assert.equal(abortStatus, 4008);
          assert.equal(abortReason, 'TooLazyHandshakeError: SC handshake failed because the server was too lazy');
          done();
        }, 200);
      });

      it('Should send back custom status code if MIDDLEWARE_HANDSHAKE_SC blocks by providing a status code', function (done) {
        var middlewareWasExecuted = false;
        var abortStatus;
        var abortReason;

        middlewareFunction = function (req, next) {
          setTimeout(function () {
            middlewareWasExecuted = true;
            var err = new Error('SC handshake failed because of invalid query auth parameters');
            err.name = 'InvalidAuthQueryHandshakeError';

            // Pass custom 4501 status code as the second argument to the next() function.
            // We will treat this code as a fatal authentication failure on the front end.
            // A status code of 4500 or higher means that the client shouldn't try to reconnect.
            next(err, 4501);
          }, 100);
        };
        server.addMiddleware(server.MIDDLEWARE_HANDSHAKE_SC, middlewareFunction);

        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });
        client.on('error', function () {});

        client.once('connectAbort', function (status, reason) {
          abortStatus = status;
          abortReason = reason;
        });

        setTimeout(function () {
          assert.equal(middlewareWasExecuted, true);
          assert.equal(abortStatus, 4501);
          assert.equal(abortReason, 'InvalidAuthQueryHandshakeError: SC handshake failed because of invalid query auth parameters');
          done();
        }, 200);
      });

      it('Should connect with a delay if next() is called after a timeout inside the middleware function', function (done) {
        var createConnectionTime = null;
        var connectEventTime = null;
        var abortStatus;
        var abortReason;

        middlewareFunction = function (req, next) {
          setTimeout(function () {
            next();
          }, 500);
        };
        server.addMiddleware(server.MIDDLEWARE_HANDSHAKE_SC, middlewareFunction);

        createConnectionTime = Date.now();
        client = socketCluster.connect({
          hostname: clientOptions.hostname,
          port: portNumber,
          multiplex: false
        });

        client.once('connectAbort', function (status, reason) {
          abortStatus = status;
          abortReason = reason;
        });
        client.once('connect', function () {
          connectEventTime = Date.now();
          assert.equal(connectEventTime - createConnectionTime > 400, true);
          done();
        });
      });
    });
  });

  describe('Errors', function () {
    it('Should throw an error if reserved event is emitted on socket', function (done) {
      server.on('connection', function (socket) {
        var error;
        socket.on('error', function (err) {
          error = err;
        });
        socket.emit('message', 123);
        setTimeout(function () {
          assert.notEqual(error, null);
          assert.equal(error.name, 'InvalidActionError');
          done();
        }, 100);
      });

      client = socketCluster.connect(clientOptions);
    });

    it('Should allow emitting error event on socket', function (done) {
      server.on('connection', function (socket) {
        var error;
        socket.on('error', function (err) {
          error = err;
        });
        var customError = new Error('This is a custom error');
        customError.name = 'CustomError';
        socket.emit('error', customError);
        setTimeout(function () {
          assert.notEqual(error, null);
          assert.equal(error.name, 'CustomError');
          done();
        }, 100);
      });

      client = socketCluster.connect(clientOptions);
    });
  });
});
