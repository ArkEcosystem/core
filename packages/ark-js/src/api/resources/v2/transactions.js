import Base from '@/api/base'

export default class Transactions extends Base {
  /**
   * [all description]
   * @return {[type]} [description]
   */
  all () {
    return this.http.get('transactions')
  }

  /**
   * [create description]
   * @param  {[type]} payload [description]
   * @return {[type]}         [description]
   */
  create (payload) {
    return this.http.post('transactions', payload)
  }

  /**
   * [get description]
   * @param  {String} id [description]
   * @return {[type]}    [description]
   */
  get (id) {
    return this.http.get(`transactions/${id}`)
  }

  /**
   * [allUnconfirmed description]
   * @return {[type]} [description]
   */
  allUnconfirmed () {
    return this.http.get('transactions/unconfirmed')
  }

  /**
   * [getUnconfirmed description]
   * @param  {String} id [description]
   * @return {[type]}    [description]
   */
  getUnconfirmed (id) {
    return this.http.get(`transactions/unconfirmed/${id}`)
  }

  /**
   * [search description]
   * @param  {[type]} payload [description]
   * @return {[type]}         [description]
   */
  search (payload) {
    return this.http.post('transactions/search', payload)
  }

  /**
   * [types description]
   * @return {[type]} [description]
   */
  types () {
    return this.http.get('transactions/types')
  }
}
