export interface BasicAuthentication {
    validate(username: string, password: string): Promise<boolean>
}

export interface TokenAuthentication {
    validate(token: string): Promise<boolean>
}
