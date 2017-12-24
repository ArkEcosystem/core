const response = require('../response')

class InternalServerErrorHttpException {
    send(req, res, data)
    {
        response.send(req, res, Object.assign(data, {
            success: false
        }), 500)
    }
}

module.exports = new InternalServerErrorHttpException
