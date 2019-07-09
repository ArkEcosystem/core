import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../enums";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class BusinessRegistration extends Transaction {
    public static type: TransactionTypes = TransactionTypes.BusinessRegistration;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.businessRegistration;
    }

    public serialize(): ByteBuffer {
        const { data } = this;

        let businessVat: Buffer;
        let businessVatLength = 0;

        let businessGithub: Buffer;
        let businessGithubLength = 0;

        const businessName: Buffer = Buffer.from(data.asset.businessRegistration.name, "utf8");
        const businessWebsite: Buffer = Buffer.from(data.asset.businessRegistration.websiteAddress, "utf8");

        if (data.asset.businessRegistration.vat !== null && data.asset.businessRegistration.vat !== undefined) {
            businessVat = Buffer.from(data.asset.businessRegistration.vat, "utf8");
            businessVatLength = businessVat.length;
        }

        if (data.asset.businessRegistration.githubRepository !== undefined) {
            businessGithub = Buffer.from(data.asset.businessRegistration.githubRepository, "utf8");
            businessGithubLength = businessGithub.length;
        }

        const buffer: ByteBuffer = new ByteBuffer(
            businessName.length + businessVatLength + businessWebsite.length + businessGithubLength + 4,
            true,
        );

        buffer.writeByte(businessName.length);
        buffer.append(businessName, "hex");

        buffer.writeByte(businessWebsite.length);
        buffer.append(businessWebsite, "hex");

        if (businessVat !== null && businessVat !== undefined) {
            buffer.writeByte(businessVat.length);
            buffer.append(businessVat, "hex");
        } else {
            buffer.writeByte(0);
        }

        if (businessGithub !== null && businessGithub !== undefined) {
            buffer.writeByte(businessGithub.length);
            buffer.append(businessGithub, "hex");
        } else {
            buffer.writeByte(0);
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        let vat: string;
        let githubRepository: string;

        const nameLength = buf.readUint8();
        const name = buf.readString(nameLength);

        const websiteLength = buf.readUint8();
        const websiteAddress = buf.readString(websiteLength);

        const vatLength = buf.readUint8();
        if (vatLength !== 0) {
            vat = buf.readString(vatLength);
        }

        const gitHubLength = buf.readUint8();
        if (gitHubLength !== 0) {
            githubRepository = buf.readString(gitHubLength);
        }

        data.asset = {
            businessRegistration: {
                name,
                websiteAddress,
                vat,
                githubRepository,
            },
        };
    }
}
