export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeIpfsType(): R;
        }
    }
}
