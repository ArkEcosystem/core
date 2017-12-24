const response = require('../response')

class BadRequestHttpException {
    send(req, res, data)
    {
        response.send(req, res, Object.assign(data, {
            success: false
        }), 400)
    }
}

module.exports = new BadRequestHttpException
