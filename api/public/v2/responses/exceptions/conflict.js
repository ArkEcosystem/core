const response = require('../response')

class ConflictHttpException {
    send(req, res, data)
    {
        response.send(req, res, data, 409)
    }
}

module.exports = new ConflictHttpException
