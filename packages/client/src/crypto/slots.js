const moment = require('moment')
const configManager = require('../managers/config')

class Slots {
  /**
   * [getEpochTime description]
   * @param  {[type]} time [description]
   * @return {[type]}      [description]
   */
  getEpochTime (time) {
    if (time === undefined) time = moment().valueOf()

    const start = this.beginEpochTime().valueOf()

    return Math.floor((time - start) / 1000)
  }

  /**
   * [beginEpochTime description]
   * @return {[type]} [description]
   */
  beginEpochTime () {
    return moment(this.getConstant('epoch')).utc()
  }

  /**
   * [getTime description]
   * @param  {[type]} time [description]
   * @return {[type]}      [description]
   */
  getTime (time) {
    return this.getEpochTime(time)
  }

  /**
   * [getRealTime description]
   * @param  {[type]} epochTime [description]
   * @return {[type]}           [description]
   */
  getRealTime (epochTime) {
    if (epochTime === undefined) epochTime = this.getTime()

    const start = Math.floor(this.beginEpochTime().valueOf() / 1000) * 1000

    return start + epochTime * 1000
  }

  /**
   * [getSlotNumber description]
   * @param  {[type]} epochTime [description]
   * @return {[type]}           [description]
   */
  getSlotNumber (epochTime) {
    if (epochTime === undefined) epochTime = this.getTime()

    return Math.floor(epochTime / this.getConstant('blocktime'))
  }

  /**
   * [getSlotTime description]
   * @param  {[type]} slot [description]
   * @return {[type]}      [description]
   */
  getSlotTime (slot) {
    return slot * this.getConstant('blocktime')
  }

  /**
   * [getNextSlot description]
   * @return {[type]} [description]
   */
  getNextSlot () {
    return this.getSlotNumber() + 1
  }

  /**
   * [getLastSlot description]
   * @param  {[type]} nextSlot [description]
   * @return {[type]}          [description]
   */
  getLastSlot (nextSlot) {
    return nextSlot + this.getConstant('activeDelegates')
  }

  /**
   * [getConstant description]
   * @param  {[type]} key [description]
   * @return {[type]}     [description]
   */
  getConstant (key) {
    return configManager.getConstants(1)[key]
  }
}

module.exports = new Slots()
