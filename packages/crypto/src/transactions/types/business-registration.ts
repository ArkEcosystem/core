import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../enums";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class BusinessRegistration extends Transaction {
    public static type: TransactionTypes = TransactionTypes.BusinessRegistration;

    public static getSchema(): schemas.TransactionSchema {
        console.log("tukaj");
        return schemas.businessRegistration;
    }

    public serialize(): ByteBuffer {
        const { data } = this;
        console.log(data);
        const businessName: Buffer = Buffer.from(data.asset.businessRegistration.name, "utf8");
        const businessWebsite: Buffer = Buffer.from(data.asset.businessRegistration.websiteAddress, "utf8");
        // const businessVat: Buffer = Buffer.from(data.asset.businessRegistration.vat, "utf8");
        // const businessGithub: Buffer = Buffer.from(data.asset.businessRegistration.githubRepository, "utf8");
        // const businessTrustLink: Buffer = Buffer.from(data.asset.businessRegistration.trustLink, "utf8");

        // const buffer: ByteBuffer = new ByteBuffer(businessName.length + businessVat.length + businessWebsite.length
        //                                             + businessGithub.length + businessTrustLink.length + 5, true);
        const buffer: ByteBuffer = new ByteBuffer(businessName.length + businessWebsite.length + 2, true);
        buffer.writeByte(businessName.length);
        buffer.append(businessName, "hex");

        buffer.writeByte(businessWebsite.length);
        buffer.append(businessWebsite, "hex");

        console.log("BUFFER:");
        console.log(buffer);
        // buffer.writeByte(businessVat.length);
        // buffer.append(businessVat, "hex");
        //
        // buffer.writeByte(businessGithub.length);
        // buffer.append(businessGithub, "hex");
        //
        // buffer.writeByte(businessTrustLink.length);
        // buffer.append(businessTrustLink, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        console.log("deserialize");
        console.log(data);
        const nameLength = buf.readUint8();
        const name = buf.readString(nameLength);

        const websiteLength = buf.readUint8();
        const websiteAddress = buf.readString(websiteLength);

        // const vatLength = buf.readUint8();
        // const vat  = buf.readString(vatLength);
        //
        // const gitHubLength = buf.readUint8();
        // const githubRepository = buf.readString(gitHubLength);
        //
        // const trustLinkLength = buf.readUint8();
        // const trustLink = buf.readString(trustLinkLength);

        data.asset = {
            businessRegistration: {
                name,
                websiteAddress,
            },
        };
    }
}
