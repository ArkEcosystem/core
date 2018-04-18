'use strict';

const path = require('path')

/**
 * [description]
 * @param  {[type]} request     [description]
 * @param  {[type]} data        [description]
 * @param  {[type]} transformer [description]
 * @return {[type]}             [description]
 */
const transformResource = (request, data, transformer) => require(path.resolve(__dirname, `../versions/${request.pre.apiVersion}/transformers/${transformer}`))(data)

/**
 * [description]
 * @param  {[type]} request      [description]
 * @param  {[type]} data         [description]
 * @param  {[type]} transformer) [description]
 * @return {[type]}              [description]
 */
const transformCollection = (request, data, transformer) => data.map((d) => transformResource(request, d, transformer))

module.exports = {
  transformResource,
  transformCollection
}
