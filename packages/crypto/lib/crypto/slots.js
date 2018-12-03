const dayjs = require('dayjs-ext')
const configManager = require('../managers/config')

class Slots {
  /**
   * Create a new Slot instance.
   */
  constructor() {
    this.resetHeight()
  }

  /**
   * Get the height we are currently at.
   * @return {Number}
   */
  getHeight() {
    return this.height
  }

  /**
   * Set the height we are currently at.
   * @param  {Number} height
   * @return {void}
   */
  setHeight(height) {
    this.height = height
  }

  /**
   * Reset the height to the initial value.
   * @return {void}
   */
  resetHeight() {
    this.height = 1
  }

  /**
   * Get epoch time relative to beginning epoch time.
   * @param  {Number} time
   * @return {Number}
   */
  getEpochTime(time) {
    if (time === undefined) {
      time = dayjs().valueOf()
    }

    const start = this.beginEpochTime().valueOf()

    return Math.floor((time - start) / 1000)
  }

  /**
   * Get beginning epoch time.
   * @return {Moment}
   */
  beginEpochTime() {
    return dayjs(this.getConstant('epoch')).utc()
  }

  /**
   * Get epoch time relative to beginning epoch time.
   * @param  {Number} time
   * @return {Number}
   */
  getTime(time) {
    return this.getEpochTime(time)
  }

  /**
   * Get real time from relative epoch time.
   * @param  {Number} epochTime
   * @return {Number}
   */
  getRealTime(epochTime) {
    if (epochTime === undefined) {
      epochTime = this.getTime()
    }

    const start = Math.floor(this.beginEpochTime().valueOf() / 1000) * 1000

    return start + epochTime * 1000
  }

  /**
   * Get the current slot number.
   * @param  {Number} epochTime
   * @return {Number}
   */
  getSlotNumber(epochTime) {
    if (epochTime === undefined) {
      epochTime = this.getTime()
    }

    return Math.floor(epochTime / this.getConstant('blocktime'))
  }

  /**
   * Get the current slot time.
   * @param  {Number} slot
   * @return {Number}
   */
  getSlotTime(slot) {
    return slot * this.getConstant('blocktime')
  }

  /**
   * Get the next slot number.
   * @return {Number}
   */
  getNextSlot() {
    return this.getSlotNumber() + 1
  }

  /**
   * Get the last slot number.
   * @param  {Number} nextSlot
   * @return {Number}
   */
  getLastSlot(nextSlot) {
    return nextSlot + this.getConstant('activeDelegates')
  }

  /**
   * Get constant from height 1.
   * @param  {String} key
   * @return {*}
   */
  getConstant(key) {
    return configManager.getConstants(this.height)[key]
  }

  /**
   * Checks if forging is allowed
   * @param  {Number} epochTime
   * @return {Boolean}
   */
  isForgingAllowed(epochTime) {
    if (epochTime === undefined) {
      epochTime = this.getTime()
    }

    const blockTime = this.getConstant('blocktime')

    return epochTime % blockTime < blockTime / 2
  }
}

module.exports = new Slots()
