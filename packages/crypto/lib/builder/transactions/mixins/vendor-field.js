module.exports = {
  mixin (Base) {
    return class extends Base {
      /**
       * Set vendor field from data.
       * @param  {(String|undefined)} data
       * @return {TransactionBuilder}
       */
      vendorField (data) {
        this.vendorField = data
        // V2
        // this.vendorFieldHex = Buffer.from(data, type).toString('hex')

        return this
      }
    }
  }
}
