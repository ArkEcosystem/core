import * as $protobuf from "protobufjs";
/** Namespace blocks. */
export namespace blocks {

    /** Properties of a PostBlockRequest. */
    interface IPostBlockRequest {

        /** PostBlockRequest block */
        block?: (Uint8Array|null);

        /** PostBlockRequest headers */
        headers?: (shared.IHeaders|null);
    }

    /** Represents a PostBlockRequest. */
    class PostBlockRequest implements IPostBlockRequest {

        /**
         * Constructs a new PostBlockRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: blocks.IPostBlockRequest);

        /** PostBlockRequest block. */
        public block: Uint8Array;

        /** PostBlockRequest headers. */
        public headers?: (shared.IHeaders|null);

        /**
         * Creates a new PostBlockRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PostBlockRequest instance
         */
        public static create(properties?: blocks.IPostBlockRequest): blocks.PostBlockRequest;

        /**
         * Encodes the specified PostBlockRequest message. Does not implicitly {@link blocks.PostBlockRequest.verify|verify} messages.
         * @param message PostBlockRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: blocks.IPostBlockRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PostBlockRequest message, length delimited. Does not implicitly {@link blocks.PostBlockRequest.verify|verify} messages.
         * @param message PostBlockRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: blocks.IPostBlockRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PostBlockRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PostBlockRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): blocks.PostBlockRequest;

        /**
         * Decodes a PostBlockRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PostBlockRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): blocks.PostBlockRequest;

        /**
         * Verifies a PostBlockRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PostBlockRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PostBlockRequest
         */
        public static fromObject(object: { [k: string]: any }): blocks.PostBlockRequest;

        /**
         * Creates a plain object from a PostBlockRequest message. Also converts values to other types if specified.
         * @param message PostBlockRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: blocks.PostBlockRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PostBlockRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a PostBlockResponse. */
    interface IPostBlockResponse {

        /** PostBlockResponse status */
        status?: (boolean|null);

        /** PostBlockResponse height */
        height?: (number|null);
    }

    /** Represents a PostBlockResponse. */
    class PostBlockResponse implements IPostBlockResponse {

        /**
         * Constructs a new PostBlockResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: blocks.IPostBlockResponse);

        /** PostBlockResponse status. */
        public status: boolean;

        /** PostBlockResponse height. */
        public height: number;

        /**
         * Creates a new PostBlockResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PostBlockResponse instance
         */
        public static create(properties?: blocks.IPostBlockResponse): blocks.PostBlockResponse;

        /**
         * Encodes the specified PostBlockResponse message. Does not implicitly {@link blocks.PostBlockResponse.verify|verify} messages.
         * @param message PostBlockResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: blocks.IPostBlockResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PostBlockResponse message, length delimited. Does not implicitly {@link blocks.PostBlockResponse.verify|verify} messages.
         * @param message PostBlockResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: blocks.IPostBlockResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PostBlockResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PostBlockResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): blocks.PostBlockResponse;

        /**
         * Decodes a PostBlockResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PostBlockResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): blocks.PostBlockResponse;

        /**
         * Verifies a PostBlockResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PostBlockResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PostBlockResponse
         */
        public static fromObject(object: { [k: string]: any }): blocks.PostBlockResponse;

        /**
         * Creates a plain object from a PostBlockResponse message. Also converts values to other types if specified.
         * @param message PostBlockResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: blocks.PostBlockResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PostBlockResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a GetBlocksRequest. */
    interface IGetBlocksRequest {

        /** GetBlocksRequest lastBlockHeight */
        lastBlockHeight?: (number|null);

        /** GetBlocksRequest blockLimit */
        blockLimit?: (number|null);

        /** GetBlocksRequest headersOnly */
        headersOnly?: (boolean|null);

        /** GetBlocksRequest serialized */
        serialized?: (boolean|null);

        /** GetBlocksRequest headers */
        headers?: (shared.IHeaders|null);
    }

    /** Represents a GetBlocksRequest. */
    class GetBlocksRequest implements IGetBlocksRequest {

        /**
         * Constructs a new GetBlocksRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: blocks.IGetBlocksRequest);

        /** GetBlocksRequest lastBlockHeight. */
        public lastBlockHeight: number;

        /** GetBlocksRequest blockLimit. */
        public blockLimit: number;

        /** GetBlocksRequest headersOnly. */
        public headersOnly: boolean;

        /** GetBlocksRequest serialized. */
        public serialized: boolean;

        /** GetBlocksRequest headers. */
        public headers?: (shared.IHeaders|null);

        /**
         * Creates a new GetBlocksRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetBlocksRequest instance
         */
        public static create(properties?: blocks.IGetBlocksRequest): blocks.GetBlocksRequest;

        /**
         * Encodes the specified GetBlocksRequest message. Does not implicitly {@link blocks.GetBlocksRequest.verify|verify} messages.
         * @param message GetBlocksRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: blocks.IGetBlocksRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetBlocksRequest message, length delimited. Does not implicitly {@link blocks.GetBlocksRequest.verify|verify} messages.
         * @param message GetBlocksRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: blocks.IGetBlocksRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetBlocksRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetBlocksRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): blocks.GetBlocksRequest;

        /**
         * Decodes a GetBlocksRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetBlocksRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): blocks.GetBlocksRequest;

        /**
         * Verifies a GetBlocksRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetBlocksRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetBlocksRequest
         */
        public static fromObject(object: { [k: string]: any }): blocks.GetBlocksRequest;

        /**
         * Creates a plain object from a GetBlocksRequest message. Also converts values to other types if specified.
         * @param message GetBlocksRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: blocks.GetBlocksRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetBlocksRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a GetBlocksResponse. */
    interface IGetBlocksResponse {

        /** GetBlocksResponse blocks */
        blocks?: (Uint8Array|null);
    }

    /** Represents a GetBlocksResponse. */
    class GetBlocksResponse implements IGetBlocksResponse {

        /**
         * Constructs a new GetBlocksResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: blocks.IGetBlocksResponse);

        /** GetBlocksResponse blocks. */
        public blocks: Uint8Array;

        /**
         * Creates a new GetBlocksResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetBlocksResponse instance
         */
        public static create(properties?: blocks.IGetBlocksResponse): blocks.GetBlocksResponse;

        /**
         * Encodes the specified GetBlocksResponse message. Does not implicitly {@link blocks.GetBlocksResponse.verify|verify} messages.
         * @param message GetBlocksResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: blocks.IGetBlocksResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetBlocksResponse message, length delimited. Does not implicitly {@link blocks.GetBlocksResponse.verify|verify} messages.
         * @param message GetBlocksResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: blocks.IGetBlocksResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetBlocksResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetBlocksResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): blocks.GetBlocksResponse;

        /**
         * Decodes a GetBlocksResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetBlocksResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): blocks.GetBlocksResponse;

        /**
         * Verifies a GetBlocksResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetBlocksResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetBlocksResponse
         */
        public static fromObject(object: { [k: string]: any }): blocks.GetBlocksResponse;

        /**
         * Creates a plain object from a GetBlocksResponse message. Also converts values to other types if specified.
         * @param message GetBlocksResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: blocks.GetBlocksResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetBlocksResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace GetBlocksResponse {

        /** Properties of a BlockHeader. */
        interface IBlockHeader {

            /** BlockHeader id */
            id?: (string|null);

            /** BlockHeader idHex */
            idHex?: (string|null);

            /** BlockHeader version */
            version?: (number|null);

            /** BlockHeader timestamp */
            timestamp?: (number|null);

            /** BlockHeader previousBlock */
            previousBlock?: (string|null);

            /** BlockHeader previousBlockHex */
            previousBlockHex?: (string|null);

            /** BlockHeader height */
            height?: (number|null);

            /** BlockHeader numberOfTransactions */
            numberOfTransactions?: (number|null);

            /** BlockHeader totalAmount */
            totalAmount?: (string|null);

            /** BlockHeader totalFee */
            totalFee?: (string|null);

            /** BlockHeader reward */
            reward?: (string|null);

            /** BlockHeader payloadLength */
            payloadLength?: (number|null);

            /** BlockHeader payloadHash */
            payloadHash?: (string|null);

            /** BlockHeader generatorPublicKey */
            generatorPublicKey?: (string|null);

            /** BlockHeader blockSignature */
            blockSignature?: (string|null);

            /** BlockHeader transactions */
            transactions?: (Uint8Array|null);
        }

        /** Represents a BlockHeader. */
        class BlockHeader implements IBlockHeader {

            /**
             * Constructs a new BlockHeader.
             * @param [properties] Properties to set
             */
            constructor(properties?: blocks.GetBlocksResponse.IBlockHeader);

            /** BlockHeader id. */
            public id: string;

            /** BlockHeader idHex. */
            public idHex: string;

            /** BlockHeader version. */
            public version: number;

            /** BlockHeader timestamp. */
            public timestamp: number;

            /** BlockHeader previousBlock. */
            public previousBlock: string;

            /** BlockHeader previousBlockHex. */
            public previousBlockHex: string;

            /** BlockHeader height. */
            public height: number;

            /** BlockHeader numberOfTransactions. */
            public numberOfTransactions: number;

            /** BlockHeader totalAmount. */
            public totalAmount: string;

            /** BlockHeader totalFee. */
            public totalFee: string;

            /** BlockHeader reward. */
            public reward: string;

            /** BlockHeader payloadLength. */
            public payloadLength: number;

            /** BlockHeader payloadHash. */
            public payloadHash: string;

            /** BlockHeader generatorPublicKey. */
            public generatorPublicKey: string;

            /** BlockHeader blockSignature. */
            public blockSignature: string;

            /** BlockHeader transactions. */
            public transactions: Uint8Array;

            /**
             * Creates a new BlockHeader instance using the specified properties.
             * @param [properties] Properties to set
             * @returns BlockHeader instance
             */
            public static create(properties?: blocks.GetBlocksResponse.IBlockHeader): blocks.GetBlocksResponse.BlockHeader;

            /**
             * Encodes the specified BlockHeader message. Does not implicitly {@link blocks.GetBlocksResponse.BlockHeader.verify|verify} messages.
             * @param message BlockHeader message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: blocks.GetBlocksResponse.IBlockHeader, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified BlockHeader message, length delimited. Does not implicitly {@link blocks.GetBlocksResponse.BlockHeader.verify|verify} messages.
             * @param message BlockHeader message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: blocks.GetBlocksResponse.IBlockHeader, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a BlockHeader message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns BlockHeader
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): blocks.GetBlocksResponse.BlockHeader;

            /**
             * Decodes a BlockHeader message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns BlockHeader
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): blocks.GetBlocksResponse.BlockHeader;

            /**
             * Verifies a BlockHeader message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a BlockHeader message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns BlockHeader
             */
            public static fromObject(object: { [k: string]: any }): blocks.GetBlocksResponse.BlockHeader;

            /**
             * Creates a plain object from a BlockHeader message. Also converts values to other types if specified.
             * @param message BlockHeader
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: blocks.GetBlocksResponse.BlockHeader, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this BlockHeader to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }
}

/** Namespace peer. */
export namespace peer {

    /** Properties of a GetPeersRequest. */
    interface IGetPeersRequest {

        /** GetPeersRequest headers */
        headers?: (shared.IHeaders|null);
    }

    /** Represents a GetPeersRequest. */
    class GetPeersRequest implements IGetPeersRequest {

        /**
         * Constructs a new GetPeersRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: peer.IGetPeersRequest);

        /** GetPeersRequest headers. */
        public headers?: (shared.IHeaders|null);

        /**
         * Creates a new GetPeersRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetPeersRequest instance
         */
        public static create(properties?: peer.IGetPeersRequest): peer.GetPeersRequest;

        /**
         * Encodes the specified GetPeersRequest message. Does not implicitly {@link peer.GetPeersRequest.verify|verify} messages.
         * @param message GetPeersRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: peer.IGetPeersRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetPeersRequest message, length delimited. Does not implicitly {@link peer.GetPeersRequest.verify|verify} messages.
         * @param message GetPeersRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: peer.IGetPeersRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetPeersRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetPeersRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): peer.GetPeersRequest;

        /**
         * Decodes a GetPeersRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetPeersRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): peer.GetPeersRequest;

        /**
         * Verifies a GetPeersRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetPeersRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetPeersRequest
         */
        public static fromObject(object: { [k: string]: any }): peer.GetPeersRequest;

        /**
         * Creates a plain object from a GetPeersRequest message. Also converts values to other types if specified.
         * @param message GetPeersRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: peer.GetPeersRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetPeersRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a GetPeersResponse. */
    interface IGetPeersResponse {

        /** GetPeersResponse peers */
        peers?: (peer.GetPeersResponse.IPeer[]|null);
    }

    /** Represents a GetPeersResponse. */
    class GetPeersResponse implements IGetPeersResponse {

        /**
         * Constructs a new GetPeersResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: peer.IGetPeersResponse);

        /** GetPeersResponse peers. */
        public peers: peer.GetPeersResponse.IPeer[];

        /**
         * Creates a new GetPeersResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetPeersResponse instance
         */
        public static create(properties?: peer.IGetPeersResponse): peer.GetPeersResponse;

        /**
         * Encodes the specified GetPeersResponse message. Does not implicitly {@link peer.GetPeersResponse.verify|verify} messages.
         * @param message GetPeersResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: peer.IGetPeersResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetPeersResponse message, length delimited. Does not implicitly {@link peer.GetPeersResponse.verify|verify} messages.
         * @param message GetPeersResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: peer.IGetPeersResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetPeersResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetPeersResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): peer.GetPeersResponse;

        /**
         * Decodes a GetPeersResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetPeersResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): peer.GetPeersResponse;

        /**
         * Verifies a GetPeersResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetPeersResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetPeersResponse
         */
        public static fromObject(object: { [k: string]: any }): peer.GetPeersResponse;

        /**
         * Creates a plain object from a GetPeersResponse message. Also converts values to other types if specified.
         * @param message GetPeersResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: peer.GetPeersResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetPeersResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace GetPeersResponse {

        /** Properties of a Peer. */
        interface IPeer {

            /** Peer ip */
            ip?: (string|null);

            /** Peer port */
            port?: (number|null);
        }

        /** Represents a Peer. */
        class Peer implements IPeer {

            /**
             * Constructs a new Peer.
             * @param [properties] Properties to set
             */
            constructor(properties?: peer.GetPeersResponse.IPeer);

            /** Peer ip. */
            public ip: string;

            /** Peer port. */
            public port: number;

            /**
             * Creates a new Peer instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Peer instance
             */
            public static create(properties?: peer.GetPeersResponse.IPeer): peer.GetPeersResponse.Peer;

            /**
             * Encodes the specified Peer message. Does not implicitly {@link peer.GetPeersResponse.Peer.verify|verify} messages.
             * @param message Peer message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: peer.GetPeersResponse.IPeer, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Peer message, length delimited. Does not implicitly {@link peer.GetPeersResponse.Peer.verify|verify} messages.
             * @param message Peer message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: peer.GetPeersResponse.IPeer, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Peer message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Peer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): peer.GetPeersResponse.Peer;

            /**
             * Decodes a Peer message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Peer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): peer.GetPeersResponse.Peer;

            /**
             * Verifies a Peer message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Peer message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Peer
             */
            public static fromObject(object: { [k: string]: any }): peer.GetPeersResponse.Peer;

            /**
             * Creates a plain object from a Peer message. Also converts values to other types if specified.
             * @param message Peer
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: peer.GetPeersResponse.Peer, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Peer to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Properties of a GetCommonBlocksRequest. */
    interface IGetCommonBlocksRequest {

        /** GetCommonBlocksRequest ids */
        ids?: (string[]|null);

        /** GetCommonBlocksRequest headers */
        headers?: (shared.IHeaders|null);
    }

    /** Represents a GetCommonBlocksRequest. */
    class GetCommonBlocksRequest implements IGetCommonBlocksRequest {

        /**
         * Constructs a new GetCommonBlocksRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: peer.IGetCommonBlocksRequest);

        /** GetCommonBlocksRequest ids. */
        public ids: string[];

        /** GetCommonBlocksRequest headers. */
        public headers?: (shared.IHeaders|null);

        /**
         * Creates a new GetCommonBlocksRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetCommonBlocksRequest instance
         */
        public static create(properties?: peer.IGetCommonBlocksRequest): peer.GetCommonBlocksRequest;

        /**
         * Encodes the specified GetCommonBlocksRequest message. Does not implicitly {@link peer.GetCommonBlocksRequest.verify|verify} messages.
         * @param message GetCommonBlocksRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: peer.IGetCommonBlocksRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetCommonBlocksRequest message, length delimited. Does not implicitly {@link peer.GetCommonBlocksRequest.verify|verify} messages.
         * @param message GetCommonBlocksRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: peer.IGetCommonBlocksRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetCommonBlocksRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetCommonBlocksRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): peer.GetCommonBlocksRequest;

        /**
         * Decodes a GetCommonBlocksRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetCommonBlocksRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): peer.GetCommonBlocksRequest;

        /**
         * Verifies a GetCommonBlocksRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetCommonBlocksRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetCommonBlocksRequest
         */
        public static fromObject(object: { [k: string]: any }): peer.GetCommonBlocksRequest;

        /**
         * Creates a plain object from a GetCommonBlocksRequest message. Also converts values to other types if specified.
         * @param message GetCommonBlocksRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: peer.GetCommonBlocksRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetCommonBlocksRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a GetCommonBlocksResponse. */
    interface IGetCommonBlocksResponse {

        /** GetCommonBlocksResponse common */
        common?: (peer.GetCommonBlocksResponse.ICommon|null);
    }

    /** Represents a GetCommonBlocksResponse. */
    class GetCommonBlocksResponse implements IGetCommonBlocksResponse {

        /**
         * Constructs a new GetCommonBlocksResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: peer.IGetCommonBlocksResponse);

        /** GetCommonBlocksResponse common. */
        public common?: (peer.GetCommonBlocksResponse.ICommon|null);

        /**
         * Creates a new GetCommonBlocksResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetCommonBlocksResponse instance
         */
        public static create(properties?: peer.IGetCommonBlocksResponse): peer.GetCommonBlocksResponse;

        /**
         * Encodes the specified GetCommonBlocksResponse message. Does not implicitly {@link peer.GetCommonBlocksResponse.verify|verify} messages.
         * @param message GetCommonBlocksResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: peer.IGetCommonBlocksResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetCommonBlocksResponse message, length delimited. Does not implicitly {@link peer.GetCommonBlocksResponse.verify|verify} messages.
         * @param message GetCommonBlocksResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: peer.IGetCommonBlocksResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetCommonBlocksResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetCommonBlocksResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): peer.GetCommonBlocksResponse;

        /**
         * Decodes a GetCommonBlocksResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetCommonBlocksResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): peer.GetCommonBlocksResponse;

        /**
         * Verifies a GetCommonBlocksResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetCommonBlocksResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetCommonBlocksResponse
         */
        public static fromObject(object: { [k: string]: any }): peer.GetCommonBlocksResponse;

        /**
         * Creates a plain object from a GetCommonBlocksResponse message. Also converts values to other types if specified.
         * @param message GetCommonBlocksResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: peer.GetCommonBlocksResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetCommonBlocksResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace GetCommonBlocksResponse {

        /** Properties of a Common. */
        interface ICommon {

            /** Common height */
            height?: (number|null);

            /** Common id */
            id?: (string|null);
        }

        /** Represents a Common. */
        class Common implements ICommon {

            /**
             * Constructs a new Common.
             * @param [properties] Properties to set
             */
            constructor(properties?: peer.GetCommonBlocksResponse.ICommon);

            /** Common height. */
            public height: number;

            /** Common id. */
            public id: string;

            /**
             * Creates a new Common instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Common instance
             */
            public static create(properties?: peer.GetCommonBlocksResponse.ICommon): peer.GetCommonBlocksResponse.Common;

            /**
             * Encodes the specified Common message. Does not implicitly {@link peer.GetCommonBlocksResponse.Common.verify|verify} messages.
             * @param message Common message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: peer.GetCommonBlocksResponse.ICommon, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Common message, length delimited. Does not implicitly {@link peer.GetCommonBlocksResponse.Common.verify|verify} messages.
             * @param message Common message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: peer.GetCommonBlocksResponse.ICommon, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Common message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Common
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): peer.GetCommonBlocksResponse.Common;

            /**
             * Decodes a Common message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Common
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): peer.GetCommonBlocksResponse.Common;

            /**
             * Verifies a Common message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Common message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Common
             */
            public static fromObject(object: { [k: string]: any }): peer.GetCommonBlocksResponse.Common;

            /**
             * Creates a plain object from a Common message. Also converts values to other types if specified.
             * @param message Common
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: peer.GetCommonBlocksResponse.Common, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Common to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Properties of a GetStatusRequest. */
    interface IGetStatusRequest {

        /** GetStatusRequest headers */
        headers?: (shared.IHeaders|null);
    }

    /** Represents a GetStatusRequest. */
    class GetStatusRequest implements IGetStatusRequest {

        /**
         * Constructs a new GetStatusRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: peer.IGetStatusRequest);

        /** GetStatusRequest headers. */
        public headers?: (shared.IHeaders|null);

        /**
         * Creates a new GetStatusRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetStatusRequest instance
         */
        public static create(properties?: peer.IGetStatusRequest): peer.GetStatusRequest;

        /**
         * Encodes the specified GetStatusRequest message. Does not implicitly {@link peer.GetStatusRequest.verify|verify} messages.
         * @param message GetStatusRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: peer.IGetStatusRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetStatusRequest message, length delimited. Does not implicitly {@link peer.GetStatusRequest.verify|verify} messages.
         * @param message GetStatusRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: peer.IGetStatusRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetStatusRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetStatusRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): peer.GetStatusRequest;

        /**
         * Decodes a GetStatusRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetStatusRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): peer.GetStatusRequest;

        /**
         * Verifies a GetStatusRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetStatusRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetStatusRequest
         */
        public static fromObject(object: { [k: string]: any }): peer.GetStatusRequest;

        /**
         * Creates a plain object from a GetStatusRequest message. Also converts values to other types if specified.
         * @param message GetStatusRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: peer.GetStatusRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetStatusRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a GetStatusResponse. */
    interface IGetStatusResponse {

        /** GetStatusResponse state */
        state?: (peer.GetStatusResponse.IState|null);

        /** GetStatusResponse config */
        config?: (peer.GetStatusResponse.IConfig|null);
    }

    /** Represents a GetStatusResponse. */
    class GetStatusResponse implements IGetStatusResponse {

        /**
         * Constructs a new GetStatusResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: peer.IGetStatusResponse);

        /** GetStatusResponse state. */
        public state?: (peer.GetStatusResponse.IState|null);

        /** GetStatusResponse config. */
        public config?: (peer.GetStatusResponse.IConfig|null);

        /**
         * Creates a new GetStatusResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetStatusResponse instance
         */
        public static create(properties?: peer.IGetStatusResponse): peer.GetStatusResponse;

        /**
         * Encodes the specified GetStatusResponse message. Does not implicitly {@link peer.GetStatusResponse.verify|verify} messages.
         * @param message GetStatusResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: peer.IGetStatusResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetStatusResponse message, length delimited. Does not implicitly {@link peer.GetStatusResponse.verify|verify} messages.
         * @param message GetStatusResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: peer.IGetStatusResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetStatusResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetStatusResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): peer.GetStatusResponse;

        /**
         * Decodes a GetStatusResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetStatusResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): peer.GetStatusResponse;

        /**
         * Verifies a GetStatusResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetStatusResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetStatusResponse
         */
        public static fromObject(object: { [k: string]: any }): peer.GetStatusResponse;

        /**
         * Creates a plain object from a GetStatusResponse message. Also converts values to other types if specified.
         * @param message GetStatusResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: peer.GetStatusResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetStatusResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace GetStatusResponse {

        /** Properties of a State. */
        interface IState {

            /** State height */
            height?: (number|null);

            /** State forgingAllowed */
            forgingAllowed?: (boolean|null);

            /** State currentSlot */
            currentSlot?: (number|null);

            /** State header */
            header?: (peer.GetStatusResponse.State.IBlockHeader|null);
        }

        /** Represents a State. */
        class State implements IState {

            /**
             * Constructs a new State.
             * @param [properties] Properties to set
             */
            constructor(properties?: peer.GetStatusResponse.IState);

            /** State height. */
            public height: number;

            /** State forgingAllowed. */
            public forgingAllowed: boolean;

            /** State currentSlot. */
            public currentSlot: number;

            /** State header. */
            public header?: (peer.GetStatusResponse.State.IBlockHeader|null);

            /**
             * Creates a new State instance using the specified properties.
             * @param [properties] Properties to set
             * @returns State instance
             */
            public static create(properties?: peer.GetStatusResponse.IState): peer.GetStatusResponse.State;

            /**
             * Encodes the specified State message. Does not implicitly {@link peer.GetStatusResponse.State.verify|verify} messages.
             * @param message State message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: peer.GetStatusResponse.IState, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified State message, length delimited. Does not implicitly {@link peer.GetStatusResponse.State.verify|verify} messages.
             * @param message State message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: peer.GetStatusResponse.IState, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a State message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns State
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): peer.GetStatusResponse.State;

            /**
             * Decodes a State message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns State
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): peer.GetStatusResponse.State;

            /**
             * Verifies a State message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a State message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns State
             */
            public static fromObject(object: { [k: string]: any }): peer.GetStatusResponse.State;

            /**
             * Creates a plain object from a State message. Also converts values to other types if specified.
             * @param message State
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: peer.GetStatusResponse.State, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this State to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace State {

            /** Properties of a BlockHeader. */
            interface IBlockHeader {

                /** BlockHeader id */
                id?: (string|null);

                /** BlockHeader idHex */
                idHex?: (string|null);

                /** BlockHeader version */
                version?: (number|null);

                /** BlockHeader timestamp */
                timestamp?: (number|null);

                /** BlockHeader previousBlock */
                previousBlock?: (string|null);

                /** BlockHeader previousBlockHex */
                previousBlockHex?: (string|null);

                /** BlockHeader height */
                height?: (number|null);

                /** BlockHeader numberOfTransactions */
                numberOfTransactions?: (number|null);

                /** BlockHeader totalAmount */
                totalAmount?: (string|null);

                /** BlockHeader totalFee */
                totalFee?: (string|null);

                /** BlockHeader reward */
                reward?: (string|null);

                /** BlockHeader payloadLength */
                payloadLength?: (number|null);

                /** BlockHeader payloadHash */
                payloadHash?: (string|null);

                /** BlockHeader generatorPublicKey */
                generatorPublicKey?: (string|null);

                /** BlockHeader blockSignature */
                blockSignature?: (string|null);
            }

            /** Represents a BlockHeader. */
            class BlockHeader implements IBlockHeader {

                /**
                 * Constructs a new BlockHeader.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: peer.GetStatusResponse.State.IBlockHeader);

                /** BlockHeader id. */
                public id: string;

                /** BlockHeader idHex. */
                public idHex: string;

                /** BlockHeader version. */
                public version: number;

                /** BlockHeader timestamp. */
                public timestamp: number;

                /** BlockHeader previousBlock. */
                public previousBlock: string;

                /** BlockHeader previousBlockHex. */
                public previousBlockHex: string;

                /** BlockHeader height. */
                public height: number;

                /** BlockHeader numberOfTransactions. */
                public numberOfTransactions: number;

                /** BlockHeader totalAmount. */
                public totalAmount: string;

                /** BlockHeader totalFee. */
                public totalFee: string;

                /** BlockHeader reward. */
                public reward: string;

                /** BlockHeader payloadLength. */
                public payloadLength: number;

                /** BlockHeader payloadHash. */
                public payloadHash: string;

                /** BlockHeader generatorPublicKey. */
                public generatorPublicKey: string;

                /** BlockHeader blockSignature. */
                public blockSignature: string;

                /**
                 * Creates a new BlockHeader instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns BlockHeader instance
                 */
                public static create(properties?: peer.GetStatusResponse.State.IBlockHeader): peer.GetStatusResponse.State.BlockHeader;

                /**
                 * Encodes the specified BlockHeader message. Does not implicitly {@link peer.GetStatusResponse.State.BlockHeader.verify|verify} messages.
                 * @param message BlockHeader message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: peer.GetStatusResponse.State.IBlockHeader, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified BlockHeader message, length delimited. Does not implicitly {@link peer.GetStatusResponse.State.BlockHeader.verify|verify} messages.
                 * @param message BlockHeader message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: peer.GetStatusResponse.State.IBlockHeader, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a BlockHeader message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns BlockHeader
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): peer.GetStatusResponse.State.BlockHeader;

                /**
                 * Decodes a BlockHeader message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns BlockHeader
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): peer.GetStatusResponse.State.BlockHeader;

                /**
                 * Verifies a BlockHeader message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a BlockHeader message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns BlockHeader
                 */
                public static fromObject(object: { [k: string]: any }): peer.GetStatusResponse.State.BlockHeader;

                /**
                 * Creates a plain object from a BlockHeader message. Also converts values to other types if specified.
                 * @param message BlockHeader
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: peer.GetStatusResponse.State.BlockHeader, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this BlockHeader to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }

        /** Properties of a Config. */
        interface IConfig {

            /** Config version */
            version?: (string|null);

            /** Config network */
            network?: (peer.GetStatusResponse.Config.INetwork|null);

            /** Config plugins */
            plugins?: ({ [k: string]: peer.GetStatusResponse.Config.IPlugin }|null);
        }

        /** Represents a Config. */
        class Config implements IConfig {

            /**
             * Constructs a new Config.
             * @param [properties] Properties to set
             */
            constructor(properties?: peer.GetStatusResponse.IConfig);

            /** Config version. */
            public version: string;

            /** Config network. */
            public network?: (peer.GetStatusResponse.Config.INetwork|null);

            /** Config plugins. */
            public plugins: { [k: string]: peer.GetStatusResponse.Config.IPlugin };

            /**
             * Creates a new Config instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Config instance
             */
            public static create(properties?: peer.GetStatusResponse.IConfig): peer.GetStatusResponse.Config;

            /**
             * Encodes the specified Config message. Does not implicitly {@link peer.GetStatusResponse.Config.verify|verify} messages.
             * @param message Config message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: peer.GetStatusResponse.IConfig, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Config message, length delimited. Does not implicitly {@link peer.GetStatusResponse.Config.verify|verify} messages.
             * @param message Config message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: peer.GetStatusResponse.IConfig, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Config message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Config
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): peer.GetStatusResponse.Config;

            /**
             * Decodes a Config message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Config
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): peer.GetStatusResponse.Config;

            /**
             * Verifies a Config message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Config message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Config
             */
            public static fromObject(object: { [k: string]: any }): peer.GetStatusResponse.Config;

            /**
             * Creates a plain object from a Config message. Also converts values to other types if specified.
             * @param message Config
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: peer.GetStatusResponse.Config, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Config to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace Config {

            /** Properties of a Network. */
            interface INetwork {

                /** Network name */
                name?: (string|null);

                /** Network nethash */
                nethash?: (string|null);

                /** Network explorer */
                explorer?: (string|null);

                /** Network token */
                token?: (peer.GetStatusResponse.Config.Network.IToken|null);

                /** Network version */
                version?: (number|null);
            }

            /** Represents a Network. */
            class Network implements INetwork {

                /**
                 * Constructs a new Network.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: peer.GetStatusResponse.Config.INetwork);

                /** Network name. */
                public name: string;

                /** Network nethash. */
                public nethash: string;

                /** Network explorer. */
                public explorer: string;

                /** Network token. */
                public token?: (peer.GetStatusResponse.Config.Network.IToken|null);

                /** Network version. */
                public version: number;

                /**
                 * Creates a new Network instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Network instance
                 */
                public static create(properties?: peer.GetStatusResponse.Config.INetwork): peer.GetStatusResponse.Config.Network;

                /**
                 * Encodes the specified Network message. Does not implicitly {@link peer.GetStatusResponse.Config.Network.verify|verify} messages.
                 * @param message Network message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: peer.GetStatusResponse.Config.INetwork, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Network message, length delimited. Does not implicitly {@link peer.GetStatusResponse.Config.Network.verify|verify} messages.
                 * @param message Network message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: peer.GetStatusResponse.Config.INetwork, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Network message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Network
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): peer.GetStatusResponse.Config.Network;

                /**
                 * Decodes a Network message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Network
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): peer.GetStatusResponse.Config.Network;

                /**
                 * Verifies a Network message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Network message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Network
                 */
                public static fromObject(object: { [k: string]: any }): peer.GetStatusResponse.Config.Network;

                /**
                 * Creates a plain object from a Network message. Also converts values to other types if specified.
                 * @param message Network
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: peer.GetStatusResponse.Config.Network, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Network to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            namespace Network {

                /** Properties of a Token. */
                interface IToken {

                    /** Token name */
                    name?: (string|null);

                    /** Token symbol */
                    symbol?: (string|null);
                }

                /** Represents a Token. */
                class Token implements IToken {

                    /**
                     * Constructs a new Token.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: peer.GetStatusResponse.Config.Network.IToken);

                    /** Token name. */
                    public name: string;

                    /** Token symbol. */
                    public symbol: string;

                    /**
                     * Creates a new Token instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns Token instance
                     */
                    public static create(properties?: peer.GetStatusResponse.Config.Network.IToken): peer.GetStatusResponse.Config.Network.Token;

                    /**
                     * Encodes the specified Token message. Does not implicitly {@link peer.GetStatusResponse.Config.Network.Token.verify|verify} messages.
                     * @param message Token message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: peer.GetStatusResponse.Config.Network.IToken, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified Token message, length delimited. Does not implicitly {@link peer.GetStatusResponse.Config.Network.Token.verify|verify} messages.
                     * @param message Token message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: peer.GetStatusResponse.Config.Network.IToken, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a Token message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns Token
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): peer.GetStatusResponse.Config.Network.Token;

                    /**
                     * Decodes a Token message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns Token
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): peer.GetStatusResponse.Config.Network.Token;

                    /**
                     * Verifies a Token message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a Token message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns Token
                     */
                    public static fromObject(object: { [k: string]: any }): peer.GetStatusResponse.Config.Network.Token;

                    /**
                     * Creates a plain object from a Token message. Also converts values to other types if specified.
                     * @param message Token
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: peer.GetStatusResponse.Config.Network.Token, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this Token to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }
            }

            /** Properties of a Plugin. */
            interface IPlugin {

                /** Plugin port */
                port?: (number|null);

                /** Plugin enabled */
                enabled?: (boolean|null);

                /** Plugin estimateTotalCount */
                estimateTotalCount?: (boolean|null);
            }

            /** Represents a Plugin. */
            class Plugin implements IPlugin {

                /**
                 * Constructs a new Plugin.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: peer.GetStatusResponse.Config.IPlugin);

                /** Plugin port. */
                public port: number;

                /** Plugin enabled. */
                public enabled: boolean;

                /** Plugin estimateTotalCount. */
                public estimateTotalCount: boolean;

                /**
                 * Creates a new Plugin instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Plugin instance
                 */
                public static create(properties?: peer.GetStatusResponse.Config.IPlugin): peer.GetStatusResponse.Config.Plugin;

                /**
                 * Encodes the specified Plugin message. Does not implicitly {@link peer.GetStatusResponse.Config.Plugin.verify|verify} messages.
                 * @param message Plugin message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: peer.GetStatusResponse.Config.IPlugin, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Plugin message, length delimited. Does not implicitly {@link peer.GetStatusResponse.Config.Plugin.verify|verify} messages.
                 * @param message Plugin message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: peer.GetStatusResponse.Config.IPlugin, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Plugin message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Plugin
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): peer.GetStatusResponse.Config.Plugin;

                /**
                 * Decodes a Plugin message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Plugin
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): peer.GetStatusResponse.Config.Plugin;

                /**
                 * Verifies a Plugin message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Plugin message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Plugin
                 */
                public static fromObject(object: { [k: string]: any }): peer.GetStatusResponse.Config.Plugin;

                /**
                 * Creates a plain object from a Plugin message. Also converts values to other types if specified.
                 * @param message Plugin
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: peer.GetStatusResponse.Config.Plugin, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Plugin to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }
    }
}

/** Namespace shared. */
export namespace shared {

    /** Properties of a Headers. */
    interface IHeaders {

        /** Headers version */
        version?: (string|null);
    }

    /** Represents a Headers. */
    class Headers implements IHeaders {

        /**
         * Constructs a new Headers.
         * @param [properties] Properties to set
         */
        constructor(properties?: shared.IHeaders);

        /** Headers version. */
        public version: string;

        /**
         * Creates a new Headers instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Headers instance
         */
        public static create(properties?: shared.IHeaders): shared.Headers;

        /**
         * Encodes the specified Headers message. Does not implicitly {@link shared.Headers.verify|verify} messages.
         * @param message Headers message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: shared.IHeaders, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Headers message, length delimited. Does not implicitly {@link shared.Headers.verify|verify} messages.
         * @param message Headers message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: shared.IHeaders, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Headers message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Headers
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): shared.Headers;

        /**
         * Decodes a Headers message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Headers
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): shared.Headers;

        /**
         * Verifies a Headers message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Headers message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Headers
         */
        public static fromObject(object: { [k: string]: any }): shared.Headers;

        /**
         * Creates a plain object from a Headers message. Also converts values to other types if specified.
         * @param message Headers
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: shared.Headers, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Headers to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }
}

/** Namespace transactions. */
export namespace transactions {

    /** Properties of a PostTransactionsRequest. */
    interface IPostTransactionsRequest {

        /** PostTransactionsRequest transactions */
        transactions?: (Uint8Array|null);

        /** PostTransactionsRequest headers */
        headers?: (shared.IHeaders|null);
    }

    /** Represents a PostTransactionsRequest. */
    class PostTransactionsRequest implements IPostTransactionsRequest {

        /**
         * Constructs a new PostTransactionsRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: transactions.IPostTransactionsRequest);

        /** PostTransactionsRequest transactions. */
        public transactions: Uint8Array;

        /** PostTransactionsRequest headers. */
        public headers?: (shared.IHeaders|null);

        /**
         * Creates a new PostTransactionsRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PostTransactionsRequest instance
         */
        public static create(properties?: transactions.IPostTransactionsRequest): transactions.PostTransactionsRequest;

        /**
         * Encodes the specified PostTransactionsRequest message. Does not implicitly {@link transactions.PostTransactionsRequest.verify|verify} messages.
         * @param message PostTransactionsRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: transactions.IPostTransactionsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PostTransactionsRequest message, length delimited. Does not implicitly {@link transactions.PostTransactionsRequest.verify|verify} messages.
         * @param message PostTransactionsRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: transactions.IPostTransactionsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PostTransactionsRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PostTransactionsRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): transactions.PostTransactionsRequest;

        /**
         * Decodes a PostTransactionsRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PostTransactionsRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): transactions.PostTransactionsRequest;

        /**
         * Verifies a PostTransactionsRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PostTransactionsRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PostTransactionsRequest
         */
        public static fromObject(object: { [k: string]: any }): transactions.PostTransactionsRequest;

        /**
         * Creates a plain object from a PostTransactionsRequest message. Also converts values to other types if specified.
         * @param message PostTransactionsRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: transactions.PostTransactionsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PostTransactionsRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a PostTransactionsResponse. */
    interface IPostTransactionsResponse {

        /** PostTransactionsResponse accept */
        accept?: (string[]|null);
    }

    /** Represents a PostTransactionsResponse. */
    class PostTransactionsResponse implements IPostTransactionsResponse {

        /**
         * Constructs a new PostTransactionsResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: transactions.IPostTransactionsResponse);

        /** PostTransactionsResponse accept. */
        public accept: string[];

        /**
         * Creates a new PostTransactionsResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PostTransactionsResponse instance
         */
        public static create(properties?: transactions.IPostTransactionsResponse): transactions.PostTransactionsResponse;

        /**
         * Encodes the specified PostTransactionsResponse message. Does not implicitly {@link transactions.PostTransactionsResponse.verify|verify} messages.
         * @param message PostTransactionsResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: transactions.IPostTransactionsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PostTransactionsResponse message, length delimited. Does not implicitly {@link transactions.PostTransactionsResponse.verify|verify} messages.
         * @param message PostTransactionsResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: transactions.IPostTransactionsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PostTransactionsResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PostTransactionsResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): transactions.PostTransactionsResponse;

        /**
         * Decodes a PostTransactionsResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PostTransactionsResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): transactions.PostTransactionsResponse;

        /**
         * Verifies a PostTransactionsResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PostTransactionsResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PostTransactionsResponse
         */
        public static fromObject(object: { [k: string]: any }): transactions.PostTransactionsResponse;

        /**
         * Creates a plain object from a PostTransactionsResponse message. Also converts values to other types if specified.
         * @param message PostTransactionsResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: transactions.PostTransactionsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PostTransactionsResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }
}
