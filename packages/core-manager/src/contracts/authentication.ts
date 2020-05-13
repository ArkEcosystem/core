export interface BasicCredentialsValidator {
    validate(username: string, password: string): Promise<boolean>;
}

export interface TokenValidator {
    validate(token: string): Promise<boolean>;
}
