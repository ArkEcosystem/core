import { IMessage } from "../interfaces";
import { INetwork } from "../interfaces/networks";
export declare class Message {
    static sign(message: string, passphrase: string): IMessage;
    static signWithWif(message: string, wif: string, network?: INetwork): IMessage;
    static verify({ message, publicKey, signature }: IMessage): boolean;
    private static createHash;
}
