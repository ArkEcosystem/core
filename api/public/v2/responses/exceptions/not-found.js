const response = require('../response')

class NotFoundHttpException {
    send(req, res, data)
    {
        response.send(req, res, data, 404)
    }
}

module.exports = new NotFoundHttpException
