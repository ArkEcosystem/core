module.exports = class Round {
  transform (round) {
    round.public_key = round.publicKey

    return round
  }

  getTable () {
    return 'rounds'
  }

  getColumns () {
    return [
      'public_key',
      'balance',
      'round'
    ]
  }
}
