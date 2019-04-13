export function hasSomeProperty(object, props): boolean {
    return props.some(prop => object.hasOwnProperty(prop));
}
