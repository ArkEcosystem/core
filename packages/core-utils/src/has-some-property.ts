/**
 * Check if an object has at least one of the given properties.
 * @param  {Object} object
 * @param  {Array}  props
 * @return {Boolean}
 */
export function hasSomeProperty(object, props): boolean {
    return props.some(prop => {
        return object.hasOwnProperty(prop);
    });
}
