export default <T>(array: Array<T>) => [...new Set<T>(array)];
