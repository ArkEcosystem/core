import Base from '@/api/base'

export default class Signatures extends Base {
  /**
   * [fee description]
   * @return {[type]} [description]
   */
  fee () {
    return this.http.get('signatures/fee')
  }
}
