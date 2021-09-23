var SCBroker = require('../../scbroker');
var scErrors = require('sc-errors');
var addMiddleware = require('./middleware');

class BrokerControllerStub extends SCBroker {
  run() {
    var self = this;

    console.log('Start broker');
    addMiddleware(self);

    self.on('masterMessage', function (data, respond) {
      if (data.killBroker) {
        console.log('Broker is shutting down');
        process.exit();
      } else {
        if (data.brokerTest) {
          if (data.brokerTest === 'test1') {
            self.sendToMaster({
              brokerSubject: 'there'
            }, function (err, data) {
              self.sendToMaster({
                brokerTestResult: 'test1',
                err: scErrors.dehydrateError(err, true),
                data: data
              });
            });
          } else if (data.brokerTest === 'test2') {
            self.sendToMaster({
              sendBackError: true
            }, function (err, data) {
              self.sendToMaster({
                brokerTestResult: 'test2',
                err: scErrors.dehydrateError(err, true),
                data: data
              });
            });
          } else if (data.brokerTest === 'test3') {
            self.sendToMaster({
              doNothing: true
            }, function (err, data) {
              self.sendToMaster({
                brokerTestResult: 'test3',
                err: scErrors.dehydrateError(err, true),
                data: data
              });
            });
          } else if (data.brokerTest === 'test4') {
            self.sendToMaster({
              doNothing: true
            });
            setTimeout(function () {
              self.sendToMaster({
                brokerTestResult: 'test4',
                err: null,
                data: null
              });
            }, 1500);
          }
        } else if (data.sendBackError) {
          var err = new Error('This is an error');
          err.name = 'CustomBrokerError';
          respond(err);
        } else if (!data.doNothing) {
          var responseData = {
            hello: data.subject
          };
          respond(null, responseData);
        }
      }
    });
  }
}

new BrokerControllerStub();
