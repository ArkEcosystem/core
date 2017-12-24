const response = require('../response')

class GoneHttpException {
    send(req, res, data)
    {
        response.send(req, res, Object.assign(data, {
            success: false
        }), 410)
    }
}

module.exports = new GoneHttpException
