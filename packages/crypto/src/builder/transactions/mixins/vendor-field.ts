export default {
  mixin(Base) {
    return class extends Base {
      /**
       * Set vendor field from data.
       * @param  {(String|undefined)} value
       * @return {TransactionBuilder}
       */
      public vendorField(value) {
        this.data.vendorField = value;
        // V2
        // this.data.vendorFieldHex = Buffer.from(value, type).toString('hex')

        return this;
      }
    };
  }
};
