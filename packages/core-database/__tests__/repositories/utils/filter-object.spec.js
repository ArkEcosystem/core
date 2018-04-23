'use strict';

const objectFilter = require('../../../lib/repositories/utils/filter-object')

describe('Object Filter', () => {
  it('should be a function', async () => {
    await expect(objectFilter).toBeFunction()
  })
})
