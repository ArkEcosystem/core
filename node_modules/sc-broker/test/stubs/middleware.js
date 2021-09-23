module.exports = function (scBroker) {
  scBroker.addMiddleware(scBroker.MIDDLEWARE_SUBSCRIBE, function (req, next) {
    if (req.channel === 'badChannel') {
      return next(new Error('bad channel'));
    }

    if (req.channel === 'delayedChannel') {
      setTimeout(function () {
        next();
      }, 500);
    } else {
      next();
    }
  });

  scBroker.addMiddleware(scBroker.MIDDLEWARE_PUBLISH_IN, function (req, next) {
    if (req.channel === 'silentChannel') {
      return next(new Error('silent channel'));
    } else if (req.command.value === 'test message') {
      req.command.value = 'transformed test message';
    }

    if (req.channel === 'delayedChannel') {
      setTimeout(function () {
        next();
      }, 500);
    } else {
      next();
    }
  });

  // Ensure middleware can be removed
  let badMiddleware = function (req, next) {
    throw new Error('This code should be unreachable!');
  };
  scBroker.addMiddleware(scBroker.MIDDLEWARE_SUBSCRIBE, badMiddleware);
  scBroker.addMiddleware(scBroker.MIDDLEWARE_PUBLISH_IN, badMiddleware);
  scBroker.removeMiddleware(scBroker.MIDDLEWARE_SUBSCRIBE, badMiddleware);
  scBroker.removeMiddleware(scBroker.MIDDLEWARE_PUBLISH_IN, badMiddleware);
};
