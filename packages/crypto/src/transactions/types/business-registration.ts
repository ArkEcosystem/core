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
        const businessName: Buffer = Buffer.from(data.asset.businessRegistraion.name, "utf8");
        const businessVat: Buffer = Buffer.from(data.asset.businessRegistraion.vat, "utf8");
        const businessWebsite: Buffer = Buffer.from(data.asset.businessRegistraion.websiteAddress, "utf8");
        const businessGithub: Buffer = Buffer.from(data.asset.businessRegistraion.githubRepository, "utf8");
        const businessTrustLink: Buffer = Buffer.from(data.asset.businessRegistraion.trustLink, "utf8");

        const buffer: ByteBuffer = new ByteBuffer(
            businessName.length +
                businessVat.length +
                businessWebsite.length +
                businessGithub.length +
                businessTrustLink.length,
            true,
        );

        buffer.writeByte(businessName.length);
        buffer.append(businessName, "hex");

        buffer.writeByte(businessVat.length);
        buffer.append(businessVat, "hex");

        buffer.writeByte(businessWebsite.length);
        buffer.append(businessWebsite, "hex");

        buffer.writeByte(businessGithub.length);
        buffer.append(businessGithub, "hex");

        buffer.writeByte(businessTrustLink.length);
        buffer.append(businessTrustLink, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const nameLength = buf.readUint8();
        const vatLength = buf.readUint8();
        const websiteLength = buf.readUint8();
        const gitHubLength = buf.readUint8();
        const trustLinkLength = buf.readUint8();

        data.asset = {
            businessRegistration: {
                name: buf.readString(nameLength),
                vat: buf.readString(vatLength),
                websiteAddress: buf.readString(websiteLength),
                githubRepository: buf.readString(gitHubLength),
                trustLink: buf.readString(trustLinkLength),
            },
        };
    }
}
