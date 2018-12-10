/**
 * Logic used by our orderBy input
 * @param {Object} parameter
 * @param {String} defaultValue
 * @return {String}
 */
export function formatOrderBy(parameter, defaultValue) {
    let order;

    if (parameter) {
        order = `${parameter.field}:${parameter.direction.toLowerCase()}`;
    }

    return order || defaultValue;
}
