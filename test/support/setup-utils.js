const BlockchainManager = require('../../core/blockchainManager')

class SetupUtils {
    ensurePublicAPI () {
        return new Promise((resolve, reject) => {
            this.waitForAPI(resolve)
        })
    }

    waitForAPI (resolve) {
        if (!BlockchainManager.getInstance().isPublicAPIMounted) {
            setTimeout(this.waitForAPI.bind(this, resolve), 5000);
        } else {
            resolve('Public API Mounted');
        }
    }
}

module.exports = new SetupUtils()
