export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeMultiSignatureType(): R;
        }
    }
}
