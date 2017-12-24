const response = require('../response')

class ConflictHttpException {
    send(req, res, data)
    {
        response.send(req, res, Object.assign(data, {
            success: false
        }), 409)
    }
}

module.exports = new ConflictHttpException
