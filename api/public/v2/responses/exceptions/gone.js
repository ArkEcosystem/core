const response = require('../response')

class GoneHttpException {
    send(req, res, data)
    {
        response.send(req, res, data, 410)
    }
}

module.exports = new GoneHttpException
