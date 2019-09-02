export const hasSomeProperty = (object, props): boolean => props.some(prop => object.hasOwnProperty(prop));
