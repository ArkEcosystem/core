module.exports = {
  mixin (Base) {
    return class extends Base {
      /**
       * Set vendor field from data.
       * @param  {(String|undefined)} data
       * @param  {Number}             type TODO why is it here? Looks that isn't used
       * @return {TransactionBuilder}
       */
      setVendorField (data, type) {
        this.vendorFieldHex = Buffer.from(data, type).toString('hex')

        return this
      }
    }
  }
}
