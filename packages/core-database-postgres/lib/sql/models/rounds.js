module.exports = class Round {
  /**
   * Convert the "camel_case" keys to "snake_case".
   * @return {Object}
   */
  transform (round) {
    round.public_key = round.publicKey

    return round
  }

  /**
   * The table associated with the model.
   * @return {String}
   */
  getTable () {
    return 'rounds'
  }

  /**
   * The attributes that are mass assignable.
   * @return {Array}
   */
  getColumns () {
    return [
      'public_key',
      'balance',
      'round'
    ]
  }
}
