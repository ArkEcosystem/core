export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidBlock(): R;
            toBeValidArrayOfBlocks(): R;
        }
    }
}
