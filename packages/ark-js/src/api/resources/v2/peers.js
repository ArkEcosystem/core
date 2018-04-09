import Base from '@/api/base'

export default class Peers extends Base {
  /**
   * [all description]
   * @return {[type]} [description]
   */
  all () {
    return this.http.get('peers')
  }

  /**
   * [get description]
   * @param  {String} ip [description]
   * @return {[type]}    [description]
   */
  get (ip) {
    return this.http.get(`peers/${ip}`)
  }
}
