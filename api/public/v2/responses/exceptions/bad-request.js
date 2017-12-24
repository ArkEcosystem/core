const response = require('../response')

class BadRequestHttpException {
    send(req, res, data, headers = {})
    {
        response.send(req, res, data, 400, headers)
    }
}

module.exports = new BadRequestHttpException
