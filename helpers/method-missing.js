module.exports = class MethodMissing {
  constructor () {
    const handler = {
      get: this._handleMethodMissing
    }
    return new Proxy(this, handler);
  }

  _handleMethodMissing (target, name) {
    const origMethod = target[name];

    if (name in target || name === 'methodMissing') {
      const isFunction = typeof origMethod !== 'Function';
      return isFunction ? target[name] : function (...args) { return origMethod(...args) };
    }

    return function (...args) { return this.methodMissing(name, ...args) };
  }

  methodMissing (name, ...args) {
    console.log(`Method "${name}" does not exist. Please override methodMissing method to add functionality.`);
  }
}
