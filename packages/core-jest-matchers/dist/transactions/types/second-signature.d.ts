export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeSecondSignatureType(): R;
        }
    }
}
