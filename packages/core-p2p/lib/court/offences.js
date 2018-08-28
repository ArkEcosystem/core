module.exports = {
  BLACKLISTED: {
    amount: 12,
    period: 'hours',
    reason: 'Blacklisted',
    weight: 10
  },
  INVALID_VERSION: {
    amount: 6,
    period: 'hours',
    reason: 'Invalid Version',
    weight: 7
  },
  INVALID_HEIGHT: {
    amount: 10,
    period: 'minutes',
    reason: 'Node is not at height',
    weight: 5
  },
  INVALID_STATUS: {
    amount: 5,
    period: 'minutes',
    reason: 'Invalid Response Status',
    weight: 3
  },
  TIMEOUT: {
    amount: 2,
    period: 'minutes',
    reason: 'Timeout',
    weight: 2
  },
  HIGH_LATENCY: {
    amount: 1,
    period: 'minutes',
    reason: 'High Latency',
    weight: 1
  },
  UNKNOWN: {
    amount: 30,
    period: 'minutes',
    reason: 'Unknown',
    weight: 5
  },
  REPEAT_OFFENDER: {
    amount: 1,
    period: 'day',
    reason: 'Repeat Offender',
    weight: 100
  }
}
