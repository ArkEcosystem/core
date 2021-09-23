module.exports.attach = function (worker, expressApp) {

  // This will be executed on every broker
  var healthCheckQueryFn = function () {
    return 1;
  };
  healthCheckQueryFn.mapIndex = '*';

  expressApp.get('/health-check', function (req, res) {

    // Check that all brokers are working
    worker.exchange.exec(healthCheckQueryFn, function (err, data) {
      if (err) {
        res.status(500).send('Failed');
      } else {
        res.status(200).send('OK');
      }
    });
  });
};
