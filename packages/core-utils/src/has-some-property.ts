export const hasSomeProperty = (object, props): boolean => {
    return props.some(prop => object.hasOwnProperty(prop));
};
