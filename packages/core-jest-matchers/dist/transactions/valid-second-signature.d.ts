export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toHaveValidSecondSignature(value: object): R;
        }
    }
}
