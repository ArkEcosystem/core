const response = require('../response')

class NotFoundHttpException {
    send(req, res, data)
    {
        response.send(req, res, Object.assign(data, {
            success: false
        }), 404)
    }
}

module.exports = new NotFoundHttpException
