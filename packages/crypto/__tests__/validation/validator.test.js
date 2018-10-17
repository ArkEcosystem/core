'use strict'

const Joi = require('joi')

let validator

beforeEach(() => {
  validator = require('../../lib/validation').validator
})

describe('Validator', () => {
  describe('validate', () => {
    it('should be a function', () => {
      expect(validator.validate).toBeFunction()
    })
  })

  describe('passes', () => {
    it('should be a function', () => {
      expect(validator.passes).toBeFunction()
    })

    it('should be true', () => {
      validator.results = {
        passes: true
      }

      expect(validator.passes()).toBeTrue()
    })

    it('should be false', () => {
      validator.results = {
        passes: false
      }

      expect(validator.passes()).toBeFalse()
    })
  })

  describe('fails', () => {
    it('should be a function', () => {
      expect(validator.fails).toBeFunction()
    })

    it('should be true', () => {
      validator.results = {
        fails: true
      }

      expect(validator.fails()).toBeTrue()
    })

    it('should be false', () => {
      validator.results = {
        fails: false
      }

      expect(validator.fails()).toBeFalse()
    })
  })

  describe('validated', () => {
    it('should be a function', () => {
      expect(validator.validated).toBeFunction()
    })

    it('should be true', () => {
      validator.results = {
        data: {
          key: 'value'
        }
      }

      expect(validator.validated()).toHaveProperty('key', 'value')
    })

    it('should be false', () => {
      validator.results = {
        data: {
          invalidKey: 'value'
        }
      }

      expect(validator.validated()).not.toHaveProperty('key', 'value')
    })
  })

  describe('extend', () => {
    it('should be a function', () => {
      expect(validator.extend).toBeFunction()
    })

    it('should add the given method', () => {
      expect(validator.rules).not.toHaveProperty('fake')

      validator.extend('fake', 'news')

      expect(validator.rules).toHaveProperty('fake')
    })
  })

  describe('__validateWithRule', () => {
    it('should be a function', () => {
      expect(validator.__validateWithRule).toBeFunction()
    })

    it('should be true', () => {
      validator.__validateWithRule('DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN', 'address')

      expect(validator.passes()).toBeTrue()
    })

    it('should be false', () => {
      validator.__validateWithRule('_DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN_', 'address')

      expect(validator.passes()).toBeFalse()
    })
  })

  describe('__validateWithFunction', () => {
    it('should be a function', () => {
      expect(validator.__validateWithFunction).toBeFunction()
    })

    it('should be true', () => {
      validator.__validateWithFunction('DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN', value => {
        return {
          data: value,
          passes: value.length === 34,
          fails: value.length !== 34
        }
      })

      expect(validator.passes()).toBeTrue()
    })

    it('should be false', () => {
      validator.__validateWithFunction('_DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN_', value => {
        return {
          data: value,
          passes: value.length === 34,
          fails: value.length !== 34
        }
      })

      expect(validator.passes()).toBeFalse()
    })
  })

  describe('__validateWithJoi', () => {
    it('should be a function', () => {
      expect(validator.__validateWithJoi).toBeFunction()
    })

    it('should be true', () => {
      validator.__validateWithJoi(
        'DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN',
        Joi.string().alphanum().length(34).required()
      )

      expect(validator.passes()).toBeTrue()
    })

    it('should be false', () => {
      validator.__validateWithJoi(
        '_DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN_',
        Joi.string().alphanum().length(34).required()
      )

      expect(validator.passes()).toBeFalse()
    })
  })

  describe('__reset', () => {
    it('should be a function', () => {
      expect(validator.__reset).toBeFunction()
    })

    it('should be empty', () => {
      validator.results = {
        key: 'value'
      }

      expect(validator.results).not.toBeNull()

      validator.__reset()

      expect(validator.results).toBeNull()
    })
  })
})
