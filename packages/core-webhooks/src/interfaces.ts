export interface Webhook {
    id?: string;
    token?: string;

    event: string;
    target: string;
    enabled: boolean;
    conditions: Array<{
        key: string;
        value: any;
        condition: string;
    }>;
}
