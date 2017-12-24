const response = require('../response')

class BadRequestHttpException {
    send(req, res, data)
    {
        response.send(req, res, data, 400)
    }
}

module.exports = new BadRequestHttpException
