export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeDelegateRegistrationType(): R;
        }
    }
}
