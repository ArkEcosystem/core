export interface BasicAuthentication {
    validate(username: string, password: string): Promise<boolean>
}
