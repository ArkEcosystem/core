/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.blocks = (function() {

    /**
     * Namespace blocks.
     * @exports blocks
     * @namespace
     */
    var blocks = {};

    blocks.PostBlockRequest = (function() {

        /**
         * Properties of a PostBlockRequest.
         * @memberof blocks
         * @interface IPostBlockRequest
         * @property {Uint8Array|null} [block] PostBlockRequest block
         * @property {shared.IHeaders|null} [headers] PostBlockRequest headers
         */

        /**
         * Constructs a new PostBlockRequest.
         * @memberof blocks
         * @classdesc Represents a PostBlockRequest.
         * @implements IPostBlockRequest
         * @constructor
         * @param {blocks.IPostBlockRequest=} [properties] Properties to set
         */
        function PostBlockRequest(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PostBlockRequest block.
         * @member {Uint8Array} block
         * @memberof blocks.PostBlockRequest
         * @instance
         */
        PostBlockRequest.prototype.block = $util.newBuffer([]);

        /**
         * PostBlockRequest headers.
         * @member {shared.IHeaders|null|undefined} headers
         * @memberof blocks.PostBlockRequest
         * @instance
         */
        PostBlockRequest.prototype.headers = null;

        /**
         * Creates a new PostBlockRequest instance using the specified properties.
         * @function create
         * @memberof blocks.PostBlockRequest
         * @static
         * @param {blocks.IPostBlockRequest=} [properties] Properties to set
         * @returns {blocks.PostBlockRequest} PostBlockRequest instance
         */
        PostBlockRequest.create = function create(properties) {
            return new PostBlockRequest(properties);
        };

        /**
         * Encodes the specified PostBlockRequest message. Does not implicitly {@link blocks.PostBlockRequest.verify|verify} messages.
         * @function encode
         * @memberof blocks.PostBlockRequest
         * @static
         * @param {blocks.IPostBlockRequest} message PostBlockRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PostBlockRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.block != null && Object.hasOwnProperty.call(message, "block"))
                writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.block);
            if (message.headers != null && Object.hasOwnProperty.call(message, "headers"))
                $root.shared.Headers.encode(message.headers, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified PostBlockRequest message, length delimited. Does not implicitly {@link blocks.PostBlockRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof blocks.PostBlockRequest
         * @static
         * @param {blocks.IPostBlockRequest} message PostBlockRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PostBlockRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PostBlockRequest message from the specified reader or buffer.
         * @function decode
         * @memberof blocks.PostBlockRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {blocks.PostBlockRequest} PostBlockRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PostBlockRequest.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.blocks.PostBlockRequest();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.block = reader.bytes();
                    break;
                case 2:
                    message.headers = $root.shared.Headers.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a PostBlockRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof blocks.PostBlockRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {blocks.PostBlockRequest} PostBlockRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PostBlockRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PostBlockRequest message.
         * @function verify
         * @memberof blocks.PostBlockRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PostBlockRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.block != null && message.hasOwnProperty("block"))
                if (!(message.block && typeof message.block.length === "number" || $util.isString(message.block)))
                    return "block: buffer expected";
            if (message.headers != null && message.hasOwnProperty("headers")) {
                var error = $root.shared.Headers.verify(message.headers);
                if (error)
                    return "headers." + error;
            }
            return null;
        };

        /**
         * Creates a PostBlockRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof blocks.PostBlockRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {blocks.PostBlockRequest} PostBlockRequest
         */
        PostBlockRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.blocks.PostBlockRequest)
                return object;
            var message = new $root.blocks.PostBlockRequest();
            if (object.block != null)
                if (typeof object.block === "string")
                    $util.base64.decode(object.block, message.block = $util.newBuffer($util.base64.length(object.block)), 0);
                else if (object.block.length)
                    message.block = object.block;
            if (object.headers != null) {
                if (typeof object.headers !== "object")
                    throw TypeError(".blocks.PostBlockRequest.headers: object expected");
                message.headers = $root.shared.Headers.fromObject(object.headers);
            }
            return message;
        };

        /**
         * Creates a plain object from a PostBlockRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof blocks.PostBlockRequest
         * @static
         * @param {blocks.PostBlockRequest} message PostBlockRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PostBlockRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                if (options.bytes === String)
                    object.block = "";
                else {
                    object.block = [];
                    if (options.bytes !== Array)
                        object.block = $util.newBuffer(object.block);
                }
                object.headers = null;
            }
            if (message.block != null && message.hasOwnProperty("block"))
                object.block = options.bytes === String ? $util.base64.encode(message.block, 0, message.block.length) : options.bytes === Array ? Array.prototype.slice.call(message.block) : message.block;
            if (message.headers != null && message.hasOwnProperty("headers"))
                object.headers = $root.shared.Headers.toObject(message.headers, options);
            return object;
        };

        /**
         * Converts this PostBlockRequest to JSON.
         * @function toJSON
         * @memberof blocks.PostBlockRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PostBlockRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return PostBlockRequest;
    })();

    blocks.PostBlockResponse = (function() {

        /**
         * Properties of a PostBlockResponse.
         * @memberof blocks
         * @interface IPostBlockResponse
         * @property {boolean|null} [status] PostBlockResponse status
         * @property {number|null} [height] PostBlockResponse height
         */

        /**
         * Constructs a new PostBlockResponse.
         * @memberof blocks
         * @classdesc Represents a PostBlockResponse.
         * @implements IPostBlockResponse
         * @constructor
         * @param {blocks.IPostBlockResponse=} [properties] Properties to set
         */
        function PostBlockResponse(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PostBlockResponse status.
         * @member {boolean} status
         * @memberof blocks.PostBlockResponse
         * @instance
         */
        PostBlockResponse.prototype.status = false;

        /**
         * PostBlockResponse height.
         * @member {number} height
         * @memberof blocks.PostBlockResponse
         * @instance
         */
        PostBlockResponse.prototype.height = 0;

        /**
         * Creates a new PostBlockResponse instance using the specified properties.
         * @function create
         * @memberof blocks.PostBlockResponse
         * @static
         * @param {blocks.IPostBlockResponse=} [properties] Properties to set
         * @returns {blocks.PostBlockResponse} PostBlockResponse instance
         */
        PostBlockResponse.create = function create(properties) {
            return new PostBlockResponse(properties);
        };

        /**
         * Encodes the specified PostBlockResponse message. Does not implicitly {@link blocks.PostBlockResponse.verify|verify} messages.
         * @function encode
         * @memberof blocks.PostBlockResponse
         * @static
         * @param {blocks.IPostBlockResponse} message PostBlockResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PostBlockResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.status != null && Object.hasOwnProperty.call(message, "status"))
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.status);
            if (message.height != null && Object.hasOwnProperty.call(message, "height"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.height);
            return writer;
        };

        /**
         * Encodes the specified PostBlockResponse message, length delimited. Does not implicitly {@link blocks.PostBlockResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof blocks.PostBlockResponse
         * @static
         * @param {blocks.IPostBlockResponse} message PostBlockResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PostBlockResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PostBlockResponse message from the specified reader or buffer.
         * @function decode
         * @memberof blocks.PostBlockResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {blocks.PostBlockResponse} PostBlockResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PostBlockResponse.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.blocks.PostBlockResponse();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.status = reader.bool();
                    break;
                case 2:
                    message.height = reader.uint32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a PostBlockResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof blocks.PostBlockResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {blocks.PostBlockResponse} PostBlockResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PostBlockResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PostBlockResponse message.
         * @function verify
         * @memberof blocks.PostBlockResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PostBlockResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.status != null && message.hasOwnProperty("status"))
                if (typeof message.status !== "boolean")
                    return "status: boolean expected";
            if (message.height != null && message.hasOwnProperty("height"))
                if (!$util.isInteger(message.height))
                    return "height: integer expected";
            return null;
        };

        /**
         * Creates a PostBlockResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof blocks.PostBlockResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {blocks.PostBlockResponse} PostBlockResponse
         */
        PostBlockResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.blocks.PostBlockResponse)
                return object;
            var message = new $root.blocks.PostBlockResponse();
            if (object.status != null)
                message.status = Boolean(object.status);
            if (object.height != null)
                message.height = object.height >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a PostBlockResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof blocks.PostBlockResponse
         * @static
         * @param {blocks.PostBlockResponse} message PostBlockResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PostBlockResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.status = false;
                object.height = 0;
            }
            if (message.status != null && message.hasOwnProperty("status"))
                object.status = message.status;
            if (message.height != null && message.hasOwnProperty("height"))
                object.height = message.height;
            return object;
        };

        /**
         * Converts this PostBlockResponse to JSON.
         * @function toJSON
         * @memberof blocks.PostBlockResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PostBlockResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return PostBlockResponse;
    })();

    blocks.GetBlocksRequest = (function() {

        /**
         * Properties of a GetBlocksRequest.
         * @memberof blocks
         * @interface IGetBlocksRequest
         * @property {number|null} [lastBlockHeight] GetBlocksRequest lastBlockHeight
         * @property {number|null} [blockLimit] GetBlocksRequest blockLimit
         * @property {boolean|null} [headersOnly] GetBlocksRequest headersOnly
         * @property {boolean|null} [serialized] GetBlocksRequest serialized
         * @property {shared.IHeaders|null} [headers] GetBlocksRequest headers
         */

        /**
         * Constructs a new GetBlocksRequest.
         * @memberof blocks
         * @classdesc Represents a GetBlocksRequest.
         * @implements IGetBlocksRequest
         * @constructor
         * @param {blocks.IGetBlocksRequest=} [properties] Properties to set
         */
        function GetBlocksRequest(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GetBlocksRequest lastBlockHeight.
         * @member {number} lastBlockHeight
         * @memberof blocks.GetBlocksRequest
         * @instance
         */
        GetBlocksRequest.prototype.lastBlockHeight = 0;

        /**
         * GetBlocksRequest blockLimit.
         * @member {number} blockLimit
         * @memberof blocks.GetBlocksRequest
         * @instance
         */
        GetBlocksRequest.prototype.blockLimit = 0;

        /**
         * GetBlocksRequest headersOnly.
         * @member {boolean} headersOnly
         * @memberof blocks.GetBlocksRequest
         * @instance
         */
        GetBlocksRequest.prototype.headersOnly = false;

        /**
         * GetBlocksRequest serialized.
         * @member {boolean} serialized
         * @memberof blocks.GetBlocksRequest
         * @instance
         */
        GetBlocksRequest.prototype.serialized = false;

        /**
         * GetBlocksRequest headers.
         * @member {shared.IHeaders|null|undefined} headers
         * @memberof blocks.GetBlocksRequest
         * @instance
         */
        GetBlocksRequest.prototype.headers = null;

        /**
         * Creates a new GetBlocksRequest instance using the specified properties.
         * @function create
         * @memberof blocks.GetBlocksRequest
         * @static
         * @param {blocks.IGetBlocksRequest=} [properties] Properties to set
         * @returns {blocks.GetBlocksRequest} GetBlocksRequest instance
         */
        GetBlocksRequest.create = function create(properties) {
            return new GetBlocksRequest(properties);
        };

        /**
         * Encodes the specified GetBlocksRequest message. Does not implicitly {@link blocks.GetBlocksRequest.verify|verify} messages.
         * @function encode
         * @memberof blocks.GetBlocksRequest
         * @static
         * @param {blocks.IGetBlocksRequest} message GetBlocksRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetBlocksRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.lastBlockHeight != null && Object.hasOwnProperty.call(message, "lastBlockHeight"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.lastBlockHeight);
            if (message.blockLimit != null && Object.hasOwnProperty.call(message, "blockLimit"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.blockLimit);
            if (message.headersOnly != null && Object.hasOwnProperty.call(message, "headersOnly"))
                writer.uint32(/* id 3, wireType 0 =*/24).bool(message.headersOnly);
            if (message.serialized != null && Object.hasOwnProperty.call(message, "serialized"))
                writer.uint32(/* id 4, wireType 0 =*/32).bool(message.serialized);
            if (message.headers != null && Object.hasOwnProperty.call(message, "headers"))
                $root.shared.Headers.encode(message.headers, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified GetBlocksRequest message, length delimited. Does not implicitly {@link blocks.GetBlocksRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof blocks.GetBlocksRequest
         * @static
         * @param {blocks.IGetBlocksRequest} message GetBlocksRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetBlocksRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a GetBlocksRequest message from the specified reader or buffer.
         * @function decode
         * @memberof blocks.GetBlocksRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {blocks.GetBlocksRequest} GetBlocksRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetBlocksRequest.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.blocks.GetBlocksRequest();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.lastBlockHeight = reader.uint32();
                    break;
                case 2:
                    message.blockLimit = reader.uint32();
                    break;
                case 3:
                    message.headersOnly = reader.bool();
                    break;
                case 4:
                    message.serialized = reader.bool();
                    break;
                case 5:
                    message.headers = $root.shared.Headers.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GetBlocksRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof blocks.GetBlocksRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {blocks.GetBlocksRequest} GetBlocksRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetBlocksRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GetBlocksRequest message.
         * @function verify
         * @memberof blocks.GetBlocksRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GetBlocksRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.lastBlockHeight != null && message.hasOwnProperty("lastBlockHeight"))
                if (!$util.isInteger(message.lastBlockHeight))
                    return "lastBlockHeight: integer expected";
            if (message.blockLimit != null && message.hasOwnProperty("blockLimit"))
                if (!$util.isInteger(message.blockLimit))
                    return "blockLimit: integer expected";
            if (message.headersOnly != null && message.hasOwnProperty("headersOnly"))
                if (typeof message.headersOnly !== "boolean")
                    return "headersOnly: boolean expected";
            if (message.serialized != null && message.hasOwnProperty("serialized"))
                if (typeof message.serialized !== "boolean")
                    return "serialized: boolean expected";
            if (message.headers != null && message.hasOwnProperty("headers")) {
                var error = $root.shared.Headers.verify(message.headers);
                if (error)
                    return "headers." + error;
            }
            return null;
        };

        /**
         * Creates a GetBlocksRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof blocks.GetBlocksRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {blocks.GetBlocksRequest} GetBlocksRequest
         */
        GetBlocksRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.blocks.GetBlocksRequest)
                return object;
            var message = new $root.blocks.GetBlocksRequest();
            if (object.lastBlockHeight != null)
                message.lastBlockHeight = object.lastBlockHeight >>> 0;
            if (object.blockLimit != null)
                message.blockLimit = object.blockLimit >>> 0;
            if (object.headersOnly != null)
                message.headersOnly = Boolean(object.headersOnly);
            if (object.serialized != null)
                message.serialized = Boolean(object.serialized);
            if (object.headers != null) {
                if (typeof object.headers !== "object")
                    throw TypeError(".blocks.GetBlocksRequest.headers: object expected");
                message.headers = $root.shared.Headers.fromObject(object.headers);
            }
            return message;
        };

        /**
         * Creates a plain object from a GetBlocksRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof blocks.GetBlocksRequest
         * @static
         * @param {blocks.GetBlocksRequest} message GetBlocksRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GetBlocksRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.lastBlockHeight = 0;
                object.blockLimit = 0;
                object.headersOnly = false;
                object.serialized = false;
                object.headers = null;
            }
            if (message.lastBlockHeight != null && message.hasOwnProperty("lastBlockHeight"))
                object.lastBlockHeight = message.lastBlockHeight;
            if (message.blockLimit != null && message.hasOwnProperty("blockLimit"))
                object.blockLimit = message.blockLimit;
            if (message.headersOnly != null && message.hasOwnProperty("headersOnly"))
                object.headersOnly = message.headersOnly;
            if (message.serialized != null && message.hasOwnProperty("serialized"))
                object.serialized = message.serialized;
            if (message.headers != null && message.hasOwnProperty("headers"))
                object.headers = $root.shared.Headers.toObject(message.headers, options);
            return object;
        };

        /**
         * Converts this GetBlocksRequest to JSON.
         * @function toJSON
         * @memberof blocks.GetBlocksRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GetBlocksRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return GetBlocksRequest;
    })();

    blocks.GetBlocksResponse = (function() {

        /**
         * Properties of a GetBlocksResponse.
         * @memberof blocks
         * @interface IGetBlocksResponse
         * @property {Uint8Array|null} [blocks] GetBlocksResponse blocks
         */

        /**
         * Constructs a new GetBlocksResponse.
         * @memberof blocks
         * @classdesc Represents a GetBlocksResponse.
         * @implements IGetBlocksResponse
         * @constructor
         * @param {blocks.IGetBlocksResponse=} [properties] Properties to set
         */
        function GetBlocksResponse(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GetBlocksResponse blocks.
         * @member {Uint8Array} blocks
         * @memberof blocks.GetBlocksResponse
         * @instance
         */
        GetBlocksResponse.prototype.blocks = $util.newBuffer([]);

        /**
         * Creates a new GetBlocksResponse instance using the specified properties.
         * @function create
         * @memberof blocks.GetBlocksResponse
         * @static
         * @param {blocks.IGetBlocksResponse=} [properties] Properties to set
         * @returns {blocks.GetBlocksResponse} GetBlocksResponse instance
         */
        GetBlocksResponse.create = function create(properties) {
            return new GetBlocksResponse(properties);
        };

        /**
         * Encodes the specified GetBlocksResponse message. Does not implicitly {@link blocks.GetBlocksResponse.verify|verify} messages.
         * @function encode
         * @memberof blocks.GetBlocksResponse
         * @static
         * @param {blocks.IGetBlocksResponse} message GetBlocksResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetBlocksResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.blocks != null && Object.hasOwnProperty.call(message, "blocks"))
                writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.blocks);
            return writer;
        };

        /**
         * Encodes the specified GetBlocksResponse message, length delimited. Does not implicitly {@link blocks.GetBlocksResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof blocks.GetBlocksResponse
         * @static
         * @param {blocks.IGetBlocksResponse} message GetBlocksResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetBlocksResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a GetBlocksResponse message from the specified reader or buffer.
         * @function decode
         * @memberof blocks.GetBlocksResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {blocks.GetBlocksResponse} GetBlocksResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetBlocksResponse.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.blocks.GetBlocksResponse();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.blocks = reader.bytes();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GetBlocksResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof blocks.GetBlocksResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {blocks.GetBlocksResponse} GetBlocksResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetBlocksResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GetBlocksResponse message.
         * @function verify
         * @memberof blocks.GetBlocksResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GetBlocksResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.blocks != null && message.hasOwnProperty("blocks"))
                if (!(message.blocks && typeof message.blocks.length === "number" || $util.isString(message.blocks)))
                    return "blocks: buffer expected";
            return null;
        };

        /**
         * Creates a GetBlocksResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof blocks.GetBlocksResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {blocks.GetBlocksResponse} GetBlocksResponse
         */
        GetBlocksResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.blocks.GetBlocksResponse)
                return object;
            var message = new $root.blocks.GetBlocksResponse();
            if (object.blocks != null)
                if (typeof object.blocks === "string")
                    $util.base64.decode(object.blocks, message.blocks = $util.newBuffer($util.base64.length(object.blocks)), 0);
                else if (object.blocks.length)
                    message.blocks = object.blocks;
            return message;
        };

        /**
         * Creates a plain object from a GetBlocksResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof blocks.GetBlocksResponse
         * @static
         * @param {blocks.GetBlocksResponse} message GetBlocksResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GetBlocksResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                if (options.bytes === String)
                    object.blocks = "";
                else {
                    object.blocks = [];
                    if (options.bytes !== Array)
                        object.blocks = $util.newBuffer(object.blocks);
                }
            if (message.blocks != null && message.hasOwnProperty("blocks"))
                object.blocks = options.bytes === String ? $util.base64.encode(message.blocks, 0, message.blocks.length) : options.bytes === Array ? Array.prototype.slice.call(message.blocks) : message.blocks;
            return object;
        };

        /**
         * Converts this GetBlocksResponse to JSON.
         * @function toJSON
         * @memberof blocks.GetBlocksResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GetBlocksResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        GetBlocksResponse.BlockHeader = (function() {

            /**
             * Properties of a BlockHeader.
             * @memberof blocks.GetBlocksResponse
             * @interface IBlockHeader
             * @property {string|null} [id] BlockHeader id
             * @property {string|null} [idHex] BlockHeader idHex
             * @property {number|null} [version] BlockHeader version
             * @property {number|null} [timestamp] BlockHeader timestamp
             * @property {string|null} [previousBlock] BlockHeader previousBlock
             * @property {string|null} [previousBlockHex] BlockHeader previousBlockHex
             * @property {number|null} [height] BlockHeader height
             * @property {number|null} [numberOfTransactions] BlockHeader numberOfTransactions
             * @property {string|null} [totalAmount] BlockHeader totalAmount
             * @property {string|null} [totalFee] BlockHeader totalFee
             * @property {string|null} [reward] BlockHeader reward
             * @property {number|null} [payloadLength] BlockHeader payloadLength
             * @property {string|null} [payloadHash] BlockHeader payloadHash
             * @property {string|null} [generatorPublicKey] BlockHeader generatorPublicKey
             * @property {string|null} [blockSignature] BlockHeader blockSignature
             * @property {Uint8Array|null} [transactions] BlockHeader transactions
             */

            /**
             * Constructs a new BlockHeader.
             * @memberof blocks.GetBlocksResponse
             * @classdesc Represents a BlockHeader.
             * @implements IBlockHeader
             * @constructor
             * @param {blocks.GetBlocksResponse.IBlockHeader=} [properties] Properties to set
             */
            function BlockHeader(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * BlockHeader id.
             * @member {string} id
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @instance
             */
            BlockHeader.prototype.id = "";

            /**
             * BlockHeader idHex.
             * @member {string} idHex
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @instance
             */
            BlockHeader.prototype.idHex = "";

            /**
             * BlockHeader version.
             * @member {number} version
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @instance
             */
            BlockHeader.prototype.version = 0;

            /**
             * BlockHeader timestamp.
             * @member {number} timestamp
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @instance
             */
            BlockHeader.prototype.timestamp = 0;

            /**
             * BlockHeader previousBlock.
             * @member {string} previousBlock
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @instance
             */
            BlockHeader.prototype.previousBlock = "";

            /**
             * BlockHeader previousBlockHex.
             * @member {string} previousBlockHex
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @instance
             */
            BlockHeader.prototype.previousBlockHex = "";

            /**
             * BlockHeader height.
             * @member {number} height
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @instance
             */
            BlockHeader.prototype.height = 0;

            /**
             * BlockHeader numberOfTransactions.
             * @member {number} numberOfTransactions
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @instance
             */
            BlockHeader.prototype.numberOfTransactions = 0;

            /**
             * BlockHeader totalAmount.
             * @member {string} totalAmount
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @instance
             */
            BlockHeader.prototype.totalAmount = "";

            /**
             * BlockHeader totalFee.
             * @member {string} totalFee
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @instance
             */
            BlockHeader.prototype.totalFee = "";

            /**
             * BlockHeader reward.
             * @member {string} reward
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @instance
             */
            BlockHeader.prototype.reward = "";

            /**
             * BlockHeader payloadLength.
             * @member {number} payloadLength
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @instance
             */
            BlockHeader.prototype.payloadLength = 0;

            /**
             * BlockHeader payloadHash.
             * @member {string} payloadHash
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @instance
             */
            BlockHeader.prototype.payloadHash = "";

            /**
             * BlockHeader generatorPublicKey.
             * @member {string} generatorPublicKey
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @instance
             */
            BlockHeader.prototype.generatorPublicKey = "";

            /**
             * BlockHeader blockSignature.
             * @member {string} blockSignature
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @instance
             */
            BlockHeader.prototype.blockSignature = "";

            /**
             * BlockHeader transactions.
             * @member {Uint8Array} transactions
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @instance
             */
            BlockHeader.prototype.transactions = $util.newBuffer([]);

            /**
             * Creates a new BlockHeader instance using the specified properties.
             * @function create
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @static
             * @param {blocks.GetBlocksResponse.IBlockHeader=} [properties] Properties to set
             * @returns {blocks.GetBlocksResponse.BlockHeader} BlockHeader instance
             */
            BlockHeader.create = function create(properties) {
                return new BlockHeader(properties);
            };

            /**
             * Encodes the specified BlockHeader message. Does not implicitly {@link blocks.GetBlocksResponse.BlockHeader.verify|verify} messages.
             * @function encode
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @static
             * @param {blocks.GetBlocksResponse.IBlockHeader} message BlockHeader message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            BlockHeader.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
                if (message.idHex != null && Object.hasOwnProperty.call(message, "idHex"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.idHex);
                if (message.version != null && Object.hasOwnProperty.call(message, "version"))
                    writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.version);
                if (message.timestamp != null && Object.hasOwnProperty.call(message, "timestamp"))
                    writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.timestamp);
                if (message.previousBlock != null && Object.hasOwnProperty.call(message, "previousBlock"))
                    writer.uint32(/* id 5, wireType 2 =*/42).string(message.previousBlock);
                if (message.previousBlockHex != null && Object.hasOwnProperty.call(message, "previousBlockHex"))
                    writer.uint32(/* id 6, wireType 2 =*/50).string(message.previousBlockHex);
                if (message.height != null && Object.hasOwnProperty.call(message, "height"))
                    writer.uint32(/* id 7, wireType 0 =*/56).uint32(message.height);
                if (message.numberOfTransactions != null && Object.hasOwnProperty.call(message, "numberOfTransactions"))
                    writer.uint32(/* id 8, wireType 0 =*/64).uint32(message.numberOfTransactions);
                if (message.totalAmount != null && Object.hasOwnProperty.call(message, "totalAmount"))
                    writer.uint32(/* id 9, wireType 2 =*/74).string(message.totalAmount);
                if (message.totalFee != null && Object.hasOwnProperty.call(message, "totalFee"))
                    writer.uint32(/* id 10, wireType 2 =*/82).string(message.totalFee);
                if (message.reward != null && Object.hasOwnProperty.call(message, "reward"))
                    writer.uint32(/* id 11, wireType 2 =*/90).string(message.reward);
                if (message.payloadLength != null && Object.hasOwnProperty.call(message, "payloadLength"))
                    writer.uint32(/* id 12, wireType 0 =*/96).uint32(message.payloadLength);
                if (message.payloadHash != null && Object.hasOwnProperty.call(message, "payloadHash"))
                    writer.uint32(/* id 13, wireType 2 =*/106).string(message.payloadHash);
                if (message.generatorPublicKey != null && Object.hasOwnProperty.call(message, "generatorPublicKey"))
                    writer.uint32(/* id 14, wireType 2 =*/114).string(message.generatorPublicKey);
                if (message.blockSignature != null && Object.hasOwnProperty.call(message, "blockSignature"))
                    writer.uint32(/* id 15, wireType 2 =*/122).string(message.blockSignature);
                if (message.transactions != null && Object.hasOwnProperty.call(message, "transactions"))
                    writer.uint32(/* id 16, wireType 2 =*/130).bytes(message.transactions);
                return writer;
            };

            /**
             * Encodes the specified BlockHeader message, length delimited. Does not implicitly {@link blocks.GetBlocksResponse.BlockHeader.verify|verify} messages.
             * @function encodeDelimited
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @static
             * @param {blocks.GetBlocksResponse.IBlockHeader} message BlockHeader message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            BlockHeader.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a BlockHeader message from the specified reader or buffer.
             * @function decode
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {blocks.GetBlocksResponse.BlockHeader} BlockHeader
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            BlockHeader.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.blocks.GetBlocksResponse.BlockHeader();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.id = reader.string();
                        break;
                    case 2:
                        message.idHex = reader.string();
                        break;
                    case 3:
                        message.version = reader.uint32();
                        break;
                    case 4:
                        message.timestamp = reader.uint32();
                        break;
                    case 5:
                        message.previousBlock = reader.string();
                        break;
                    case 6:
                        message.previousBlockHex = reader.string();
                        break;
                    case 7:
                        message.height = reader.uint32();
                        break;
                    case 8:
                        message.numberOfTransactions = reader.uint32();
                        break;
                    case 9:
                        message.totalAmount = reader.string();
                        break;
                    case 10:
                        message.totalFee = reader.string();
                        break;
                    case 11:
                        message.reward = reader.string();
                        break;
                    case 12:
                        message.payloadLength = reader.uint32();
                        break;
                    case 13:
                        message.payloadHash = reader.string();
                        break;
                    case 14:
                        message.generatorPublicKey = reader.string();
                        break;
                    case 15:
                        message.blockSignature = reader.string();
                        break;
                    case 16:
                        message.transactions = reader.bytes();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a BlockHeader message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {blocks.GetBlocksResponse.BlockHeader} BlockHeader
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            BlockHeader.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a BlockHeader message.
             * @function verify
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            BlockHeader.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.id != null && message.hasOwnProperty("id"))
                    if (!$util.isString(message.id))
                        return "id: string expected";
                if (message.idHex != null && message.hasOwnProperty("idHex"))
                    if (!$util.isString(message.idHex))
                        return "idHex: string expected";
                if (message.version != null && message.hasOwnProperty("version"))
                    if (!$util.isInteger(message.version))
                        return "version: integer expected";
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    if (!$util.isInteger(message.timestamp))
                        return "timestamp: integer expected";
                if (message.previousBlock != null && message.hasOwnProperty("previousBlock"))
                    if (!$util.isString(message.previousBlock))
                        return "previousBlock: string expected";
                if (message.previousBlockHex != null && message.hasOwnProperty("previousBlockHex"))
                    if (!$util.isString(message.previousBlockHex))
                        return "previousBlockHex: string expected";
                if (message.height != null && message.hasOwnProperty("height"))
                    if (!$util.isInteger(message.height))
                        return "height: integer expected";
                if (message.numberOfTransactions != null && message.hasOwnProperty("numberOfTransactions"))
                    if (!$util.isInteger(message.numberOfTransactions))
                        return "numberOfTransactions: integer expected";
                if (message.totalAmount != null && message.hasOwnProperty("totalAmount"))
                    if (!$util.isString(message.totalAmount))
                        return "totalAmount: string expected";
                if (message.totalFee != null && message.hasOwnProperty("totalFee"))
                    if (!$util.isString(message.totalFee))
                        return "totalFee: string expected";
                if (message.reward != null && message.hasOwnProperty("reward"))
                    if (!$util.isString(message.reward))
                        return "reward: string expected";
                if (message.payloadLength != null && message.hasOwnProperty("payloadLength"))
                    if (!$util.isInteger(message.payloadLength))
                        return "payloadLength: integer expected";
                if (message.payloadHash != null && message.hasOwnProperty("payloadHash"))
                    if (!$util.isString(message.payloadHash))
                        return "payloadHash: string expected";
                if (message.generatorPublicKey != null && message.hasOwnProperty("generatorPublicKey"))
                    if (!$util.isString(message.generatorPublicKey))
                        return "generatorPublicKey: string expected";
                if (message.blockSignature != null && message.hasOwnProperty("blockSignature"))
                    if (!$util.isString(message.blockSignature))
                        return "blockSignature: string expected";
                if (message.transactions != null && message.hasOwnProperty("transactions"))
                    if (!(message.transactions && typeof message.transactions.length === "number" || $util.isString(message.transactions)))
                        return "transactions: buffer expected";
                return null;
            };

            /**
             * Creates a BlockHeader message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {blocks.GetBlocksResponse.BlockHeader} BlockHeader
             */
            BlockHeader.fromObject = function fromObject(object) {
                if (object instanceof $root.blocks.GetBlocksResponse.BlockHeader)
                    return object;
                var message = new $root.blocks.GetBlocksResponse.BlockHeader();
                if (object.id != null)
                    message.id = String(object.id);
                if (object.idHex != null)
                    message.idHex = String(object.idHex);
                if (object.version != null)
                    message.version = object.version >>> 0;
                if (object.timestamp != null)
                    message.timestamp = object.timestamp >>> 0;
                if (object.previousBlock != null)
                    message.previousBlock = String(object.previousBlock);
                if (object.previousBlockHex != null)
                    message.previousBlockHex = String(object.previousBlockHex);
                if (object.height != null)
                    message.height = object.height >>> 0;
                if (object.numberOfTransactions != null)
                    message.numberOfTransactions = object.numberOfTransactions >>> 0;
                if (object.totalAmount != null)
                    message.totalAmount = String(object.totalAmount);
                if (object.totalFee != null)
                    message.totalFee = String(object.totalFee);
                if (object.reward != null)
                    message.reward = String(object.reward);
                if (object.payloadLength != null)
                    message.payloadLength = object.payloadLength >>> 0;
                if (object.payloadHash != null)
                    message.payloadHash = String(object.payloadHash);
                if (object.generatorPublicKey != null)
                    message.generatorPublicKey = String(object.generatorPublicKey);
                if (object.blockSignature != null)
                    message.blockSignature = String(object.blockSignature);
                if (object.transactions != null)
                    if (typeof object.transactions === "string")
                        $util.base64.decode(object.transactions, message.transactions = $util.newBuffer($util.base64.length(object.transactions)), 0);
                    else if (object.transactions.length)
                        message.transactions = object.transactions;
                return message;
            };

            /**
             * Creates a plain object from a BlockHeader message. Also converts values to other types if specified.
             * @function toObject
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @static
             * @param {blocks.GetBlocksResponse.BlockHeader} message BlockHeader
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            BlockHeader.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.id = "";
                    object.idHex = "";
                    object.version = 0;
                    object.timestamp = 0;
                    object.previousBlock = "";
                    object.previousBlockHex = "";
                    object.height = 0;
                    object.numberOfTransactions = 0;
                    object.totalAmount = "";
                    object.totalFee = "";
                    object.reward = "";
                    object.payloadLength = 0;
                    object.payloadHash = "";
                    object.generatorPublicKey = "";
                    object.blockSignature = "";
                    if (options.bytes === String)
                        object.transactions = "";
                    else {
                        object.transactions = [];
                        if (options.bytes !== Array)
                            object.transactions = $util.newBuffer(object.transactions);
                    }
                }
                if (message.id != null && message.hasOwnProperty("id"))
                    object.id = message.id;
                if (message.idHex != null && message.hasOwnProperty("idHex"))
                    object.idHex = message.idHex;
                if (message.version != null && message.hasOwnProperty("version"))
                    object.version = message.version;
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    object.timestamp = message.timestamp;
                if (message.previousBlock != null && message.hasOwnProperty("previousBlock"))
                    object.previousBlock = message.previousBlock;
                if (message.previousBlockHex != null && message.hasOwnProperty("previousBlockHex"))
                    object.previousBlockHex = message.previousBlockHex;
                if (message.height != null && message.hasOwnProperty("height"))
                    object.height = message.height;
                if (message.numberOfTransactions != null && message.hasOwnProperty("numberOfTransactions"))
                    object.numberOfTransactions = message.numberOfTransactions;
                if (message.totalAmount != null && message.hasOwnProperty("totalAmount"))
                    object.totalAmount = message.totalAmount;
                if (message.totalFee != null && message.hasOwnProperty("totalFee"))
                    object.totalFee = message.totalFee;
                if (message.reward != null && message.hasOwnProperty("reward"))
                    object.reward = message.reward;
                if (message.payloadLength != null && message.hasOwnProperty("payloadLength"))
                    object.payloadLength = message.payloadLength;
                if (message.payloadHash != null && message.hasOwnProperty("payloadHash"))
                    object.payloadHash = message.payloadHash;
                if (message.generatorPublicKey != null && message.hasOwnProperty("generatorPublicKey"))
                    object.generatorPublicKey = message.generatorPublicKey;
                if (message.blockSignature != null && message.hasOwnProperty("blockSignature"))
                    object.blockSignature = message.blockSignature;
                if (message.transactions != null && message.hasOwnProperty("transactions"))
                    object.transactions = options.bytes === String ? $util.base64.encode(message.transactions, 0, message.transactions.length) : options.bytes === Array ? Array.prototype.slice.call(message.transactions) : message.transactions;
                return object;
            };

            /**
             * Converts this BlockHeader to JSON.
             * @function toJSON
             * @memberof blocks.GetBlocksResponse.BlockHeader
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            BlockHeader.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return BlockHeader;
        })();

        return GetBlocksResponse;
    })();

    return blocks;
})();

$root.peer = (function() {

    /**
     * Namespace peer.
     * @exports peer
     * @namespace
     */
    var peer = {};

    peer.GetPeersRequest = (function() {

        /**
         * Properties of a GetPeersRequest.
         * @memberof peer
         * @interface IGetPeersRequest
         * @property {shared.IHeaders|null} [headers] GetPeersRequest headers
         */

        /**
         * Constructs a new GetPeersRequest.
         * @memberof peer
         * @classdesc Represents a GetPeersRequest.
         * @implements IGetPeersRequest
         * @constructor
         * @param {peer.IGetPeersRequest=} [properties] Properties to set
         */
        function GetPeersRequest(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GetPeersRequest headers.
         * @member {shared.IHeaders|null|undefined} headers
         * @memberof peer.GetPeersRequest
         * @instance
         */
        GetPeersRequest.prototype.headers = null;

        /**
         * Creates a new GetPeersRequest instance using the specified properties.
         * @function create
         * @memberof peer.GetPeersRequest
         * @static
         * @param {peer.IGetPeersRequest=} [properties] Properties to set
         * @returns {peer.GetPeersRequest} GetPeersRequest instance
         */
        GetPeersRequest.create = function create(properties) {
            return new GetPeersRequest(properties);
        };

        /**
         * Encodes the specified GetPeersRequest message. Does not implicitly {@link peer.GetPeersRequest.verify|verify} messages.
         * @function encode
         * @memberof peer.GetPeersRequest
         * @static
         * @param {peer.IGetPeersRequest} message GetPeersRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetPeersRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.headers != null && Object.hasOwnProperty.call(message, "headers"))
                $root.shared.Headers.encode(message.headers, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified GetPeersRequest message, length delimited. Does not implicitly {@link peer.GetPeersRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof peer.GetPeersRequest
         * @static
         * @param {peer.IGetPeersRequest} message GetPeersRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetPeersRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a GetPeersRequest message from the specified reader or buffer.
         * @function decode
         * @memberof peer.GetPeersRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {peer.GetPeersRequest} GetPeersRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetPeersRequest.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.peer.GetPeersRequest();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.headers = $root.shared.Headers.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GetPeersRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof peer.GetPeersRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {peer.GetPeersRequest} GetPeersRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetPeersRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GetPeersRequest message.
         * @function verify
         * @memberof peer.GetPeersRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GetPeersRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.headers != null && message.hasOwnProperty("headers")) {
                var error = $root.shared.Headers.verify(message.headers);
                if (error)
                    return "headers." + error;
            }
            return null;
        };

        /**
         * Creates a GetPeersRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof peer.GetPeersRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {peer.GetPeersRequest} GetPeersRequest
         */
        GetPeersRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.peer.GetPeersRequest)
                return object;
            var message = new $root.peer.GetPeersRequest();
            if (object.headers != null) {
                if (typeof object.headers !== "object")
                    throw TypeError(".peer.GetPeersRequest.headers: object expected");
                message.headers = $root.shared.Headers.fromObject(object.headers);
            }
            return message;
        };

        /**
         * Creates a plain object from a GetPeersRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof peer.GetPeersRequest
         * @static
         * @param {peer.GetPeersRequest} message GetPeersRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GetPeersRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.headers = null;
            if (message.headers != null && message.hasOwnProperty("headers"))
                object.headers = $root.shared.Headers.toObject(message.headers, options);
            return object;
        };

        /**
         * Converts this GetPeersRequest to JSON.
         * @function toJSON
         * @memberof peer.GetPeersRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GetPeersRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return GetPeersRequest;
    })();

    peer.GetPeersResponse = (function() {

        /**
         * Properties of a GetPeersResponse.
         * @memberof peer
         * @interface IGetPeersResponse
         * @property {Array.<peer.GetPeersResponse.IPeer>|null} [peers] GetPeersResponse peers
         */

        /**
         * Constructs a new GetPeersResponse.
         * @memberof peer
         * @classdesc Represents a GetPeersResponse.
         * @implements IGetPeersResponse
         * @constructor
         * @param {peer.IGetPeersResponse=} [properties] Properties to set
         */
        function GetPeersResponse(properties) {
            this.peers = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GetPeersResponse peers.
         * @member {Array.<peer.GetPeersResponse.IPeer>} peers
         * @memberof peer.GetPeersResponse
         * @instance
         */
        GetPeersResponse.prototype.peers = $util.emptyArray;

        /**
         * Creates a new GetPeersResponse instance using the specified properties.
         * @function create
         * @memberof peer.GetPeersResponse
         * @static
         * @param {peer.IGetPeersResponse=} [properties] Properties to set
         * @returns {peer.GetPeersResponse} GetPeersResponse instance
         */
        GetPeersResponse.create = function create(properties) {
            return new GetPeersResponse(properties);
        };

        /**
         * Encodes the specified GetPeersResponse message. Does not implicitly {@link peer.GetPeersResponse.verify|verify} messages.
         * @function encode
         * @memberof peer.GetPeersResponse
         * @static
         * @param {peer.IGetPeersResponse} message GetPeersResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetPeersResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.peers != null && message.peers.length)
                for (var i = 0; i < message.peers.length; ++i)
                    $root.peer.GetPeersResponse.Peer.encode(message.peers[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified GetPeersResponse message, length delimited. Does not implicitly {@link peer.GetPeersResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof peer.GetPeersResponse
         * @static
         * @param {peer.IGetPeersResponse} message GetPeersResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetPeersResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a GetPeersResponse message from the specified reader or buffer.
         * @function decode
         * @memberof peer.GetPeersResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {peer.GetPeersResponse} GetPeersResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetPeersResponse.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.peer.GetPeersResponse();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.peers && message.peers.length))
                        message.peers = [];
                    message.peers.push($root.peer.GetPeersResponse.Peer.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GetPeersResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof peer.GetPeersResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {peer.GetPeersResponse} GetPeersResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetPeersResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GetPeersResponse message.
         * @function verify
         * @memberof peer.GetPeersResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GetPeersResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.peers != null && message.hasOwnProperty("peers")) {
                if (!Array.isArray(message.peers))
                    return "peers: array expected";
                for (var i = 0; i < message.peers.length; ++i) {
                    var error = $root.peer.GetPeersResponse.Peer.verify(message.peers[i]);
                    if (error)
                        return "peers." + error;
                }
            }
            return null;
        };

        /**
         * Creates a GetPeersResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof peer.GetPeersResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {peer.GetPeersResponse} GetPeersResponse
         */
        GetPeersResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.peer.GetPeersResponse)
                return object;
            var message = new $root.peer.GetPeersResponse();
            if (object.peers) {
                if (!Array.isArray(object.peers))
                    throw TypeError(".peer.GetPeersResponse.peers: array expected");
                message.peers = [];
                for (var i = 0; i < object.peers.length; ++i) {
                    if (typeof object.peers[i] !== "object")
                        throw TypeError(".peer.GetPeersResponse.peers: object expected");
                    message.peers[i] = $root.peer.GetPeersResponse.Peer.fromObject(object.peers[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a GetPeersResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof peer.GetPeersResponse
         * @static
         * @param {peer.GetPeersResponse} message GetPeersResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GetPeersResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.peers = [];
            if (message.peers && message.peers.length) {
                object.peers = [];
                for (var j = 0; j < message.peers.length; ++j)
                    object.peers[j] = $root.peer.GetPeersResponse.Peer.toObject(message.peers[j], options);
            }
            return object;
        };

        /**
         * Converts this GetPeersResponse to JSON.
         * @function toJSON
         * @memberof peer.GetPeersResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GetPeersResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        GetPeersResponse.Peer = (function() {

            /**
             * Properties of a Peer.
             * @memberof peer.GetPeersResponse
             * @interface IPeer
             * @property {string|null} [ip] Peer ip
             * @property {number|null} [port] Peer port
             */

            /**
             * Constructs a new Peer.
             * @memberof peer.GetPeersResponse
             * @classdesc Represents a Peer.
             * @implements IPeer
             * @constructor
             * @param {peer.GetPeersResponse.IPeer=} [properties] Properties to set
             */
            function Peer(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Peer ip.
             * @member {string} ip
             * @memberof peer.GetPeersResponse.Peer
             * @instance
             */
            Peer.prototype.ip = "";

            /**
             * Peer port.
             * @member {number} port
             * @memberof peer.GetPeersResponse.Peer
             * @instance
             */
            Peer.prototype.port = 0;

            /**
             * Creates a new Peer instance using the specified properties.
             * @function create
             * @memberof peer.GetPeersResponse.Peer
             * @static
             * @param {peer.GetPeersResponse.IPeer=} [properties] Properties to set
             * @returns {peer.GetPeersResponse.Peer} Peer instance
             */
            Peer.create = function create(properties) {
                return new Peer(properties);
            };

            /**
             * Encodes the specified Peer message. Does not implicitly {@link peer.GetPeersResponse.Peer.verify|verify} messages.
             * @function encode
             * @memberof peer.GetPeersResponse.Peer
             * @static
             * @param {peer.GetPeersResponse.IPeer} message Peer message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Peer.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.ip != null && Object.hasOwnProperty.call(message, "ip"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.ip);
                if (message.port != null && Object.hasOwnProperty.call(message, "port"))
                    writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.port);
                return writer;
            };

            /**
             * Encodes the specified Peer message, length delimited. Does not implicitly {@link peer.GetPeersResponse.Peer.verify|verify} messages.
             * @function encodeDelimited
             * @memberof peer.GetPeersResponse.Peer
             * @static
             * @param {peer.GetPeersResponse.IPeer} message Peer message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Peer.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Peer message from the specified reader or buffer.
             * @function decode
             * @memberof peer.GetPeersResponse.Peer
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {peer.GetPeersResponse.Peer} Peer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Peer.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.peer.GetPeersResponse.Peer();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.ip = reader.string();
                        break;
                    case 2:
                        message.port = reader.uint32();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Peer message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof peer.GetPeersResponse.Peer
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {peer.GetPeersResponse.Peer} Peer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Peer.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Peer message.
             * @function verify
             * @memberof peer.GetPeersResponse.Peer
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Peer.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.ip != null && message.hasOwnProperty("ip"))
                    if (!$util.isString(message.ip))
                        return "ip: string expected";
                if (message.port != null && message.hasOwnProperty("port"))
                    if (!$util.isInteger(message.port))
                        return "port: integer expected";
                return null;
            };

            /**
             * Creates a Peer message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof peer.GetPeersResponse.Peer
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {peer.GetPeersResponse.Peer} Peer
             */
            Peer.fromObject = function fromObject(object) {
                if (object instanceof $root.peer.GetPeersResponse.Peer)
                    return object;
                var message = new $root.peer.GetPeersResponse.Peer();
                if (object.ip != null)
                    message.ip = String(object.ip);
                if (object.port != null)
                    message.port = object.port >>> 0;
                return message;
            };

            /**
             * Creates a plain object from a Peer message. Also converts values to other types if specified.
             * @function toObject
             * @memberof peer.GetPeersResponse.Peer
             * @static
             * @param {peer.GetPeersResponse.Peer} message Peer
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Peer.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.ip = "";
                    object.port = 0;
                }
                if (message.ip != null && message.hasOwnProperty("ip"))
                    object.ip = message.ip;
                if (message.port != null && message.hasOwnProperty("port"))
                    object.port = message.port;
                return object;
            };

            /**
             * Converts this Peer to JSON.
             * @function toJSON
             * @memberof peer.GetPeersResponse.Peer
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Peer.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return Peer;
        })();

        return GetPeersResponse;
    })();

    peer.GetCommonBlocksRequest = (function() {

        /**
         * Properties of a GetCommonBlocksRequest.
         * @memberof peer
         * @interface IGetCommonBlocksRequest
         * @property {Array.<string>|null} [ids] GetCommonBlocksRequest ids
         * @property {shared.IHeaders|null} [headers] GetCommonBlocksRequest headers
         */

        /**
         * Constructs a new GetCommonBlocksRequest.
         * @memberof peer
         * @classdesc Represents a GetCommonBlocksRequest.
         * @implements IGetCommonBlocksRequest
         * @constructor
         * @param {peer.IGetCommonBlocksRequest=} [properties] Properties to set
         */
        function GetCommonBlocksRequest(properties) {
            this.ids = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GetCommonBlocksRequest ids.
         * @member {Array.<string>} ids
         * @memberof peer.GetCommonBlocksRequest
         * @instance
         */
        GetCommonBlocksRequest.prototype.ids = $util.emptyArray;

        /**
         * GetCommonBlocksRequest headers.
         * @member {shared.IHeaders|null|undefined} headers
         * @memberof peer.GetCommonBlocksRequest
         * @instance
         */
        GetCommonBlocksRequest.prototype.headers = null;

        /**
         * Creates a new GetCommonBlocksRequest instance using the specified properties.
         * @function create
         * @memberof peer.GetCommonBlocksRequest
         * @static
         * @param {peer.IGetCommonBlocksRequest=} [properties] Properties to set
         * @returns {peer.GetCommonBlocksRequest} GetCommonBlocksRequest instance
         */
        GetCommonBlocksRequest.create = function create(properties) {
            return new GetCommonBlocksRequest(properties);
        };

        /**
         * Encodes the specified GetCommonBlocksRequest message. Does not implicitly {@link peer.GetCommonBlocksRequest.verify|verify} messages.
         * @function encode
         * @memberof peer.GetCommonBlocksRequest
         * @static
         * @param {peer.IGetCommonBlocksRequest} message GetCommonBlocksRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetCommonBlocksRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.ids != null && message.ids.length)
                for (var i = 0; i < message.ids.length; ++i)
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.ids[i]);
            if (message.headers != null && Object.hasOwnProperty.call(message, "headers"))
                $root.shared.Headers.encode(message.headers, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified GetCommonBlocksRequest message, length delimited. Does not implicitly {@link peer.GetCommonBlocksRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof peer.GetCommonBlocksRequest
         * @static
         * @param {peer.IGetCommonBlocksRequest} message GetCommonBlocksRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetCommonBlocksRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a GetCommonBlocksRequest message from the specified reader or buffer.
         * @function decode
         * @memberof peer.GetCommonBlocksRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {peer.GetCommonBlocksRequest} GetCommonBlocksRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetCommonBlocksRequest.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.peer.GetCommonBlocksRequest();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.ids && message.ids.length))
                        message.ids = [];
                    message.ids.push(reader.string());
                    break;
                case 2:
                    message.headers = $root.shared.Headers.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GetCommonBlocksRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof peer.GetCommonBlocksRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {peer.GetCommonBlocksRequest} GetCommonBlocksRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetCommonBlocksRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GetCommonBlocksRequest message.
         * @function verify
         * @memberof peer.GetCommonBlocksRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GetCommonBlocksRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.ids != null && message.hasOwnProperty("ids")) {
                if (!Array.isArray(message.ids))
                    return "ids: array expected";
                for (var i = 0; i < message.ids.length; ++i)
                    if (!$util.isString(message.ids[i]))
                        return "ids: string[] expected";
            }
            if (message.headers != null && message.hasOwnProperty("headers")) {
                var error = $root.shared.Headers.verify(message.headers);
                if (error)
                    return "headers." + error;
            }
            return null;
        };

        /**
         * Creates a GetCommonBlocksRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof peer.GetCommonBlocksRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {peer.GetCommonBlocksRequest} GetCommonBlocksRequest
         */
        GetCommonBlocksRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.peer.GetCommonBlocksRequest)
                return object;
            var message = new $root.peer.GetCommonBlocksRequest();
            if (object.ids) {
                if (!Array.isArray(object.ids))
                    throw TypeError(".peer.GetCommonBlocksRequest.ids: array expected");
                message.ids = [];
                for (var i = 0; i < object.ids.length; ++i)
                    message.ids[i] = String(object.ids[i]);
            }
            if (object.headers != null) {
                if (typeof object.headers !== "object")
                    throw TypeError(".peer.GetCommonBlocksRequest.headers: object expected");
                message.headers = $root.shared.Headers.fromObject(object.headers);
            }
            return message;
        };

        /**
         * Creates a plain object from a GetCommonBlocksRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof peer.GetCommonBlocksRequest
         * @static
         * @param {peer.GetCommonBlocksRequest} message GetCommonBlocksRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GetCommonBlocksRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.ids = [];
            if (options.defaults)
                object.headers = null;
            if (message.ids && message.ids.length) {
                object.ids = [];
                for (var j = 0; j < message.ids.length; ++j)
                    object.ids[j] = message.ids[j];
            }
            if (message.headers != null && message.hasOwnProperty("headers"))
                object.headers = $root.shared.Headers.toObject(message.headers, options);
            return object;
        };

        /**
         * Converts this GetCommonBlocksRequest to JSON.
         * @function toJSON
         * @memberof peer.GetCommonBlocksRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GetCommonBlocksRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return GetCommonBlocksRequest;
    })();

    peer.GetCommonBlocksResponse = (function() {

        /**
         * Properties of a GetCommonBlocksResponse.
         * @memberof peer
         * @interface IGetCommonBlocksResponse
         * @property {peer.GetCommonBlocksResponse.ICommon|null} [common] GetCommonBlocksResponse common
         */

        /**
         * Constructs a new GetCommonBlocksResponse.
         * @memberof peer
         * @classdesc Represents a GetCommonBlocksResponse.
         * @implements IGetCommonBlocksResponse
         * @constructor
         * @param {peer.IGetCommonBlocksResponse=} [properties] Properties to set
         */
        function GetCommonBlocksResponse(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GetCommonBlocksResponse common.
         * @member {peer.GetCommonBlocksResponse.ICommon|null|undefined} common
         * @memberof peer.GetCommonBlocksResponse
         * @instance
         */
        GetCommonBlocksResponse.prototype.common = null;

        /**
         * Creates a new GetCommonBlocksResponse instance using the specified properties.
         * @function create
         * @memberof peer.GetCommonBlocksResponse
         * @static
         * @param {peer.IGetCommonBlocksResponse=} [properties] Properties to set
         * @returns {peer.GetCommonBlocksResponse} GetCommonBlocksResponse instance
         */
        GetCommonBlocksResponse.create = function create(properties) {
            return new GetCommonBlocksResponse(properties);
        };

        /**
         * Encodes the specified GetCommonBlocksResponse message. Does not implicitly {@link peer.GetCommonBlocksResponse.verify|verify} messages.
         * @function encode
         * @memberof peer.GetCommonBlocksResponse
         * @static
         * @param {peer.IGetCommonBlocksResponse} message GetCommonBlocksResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetCommonBlocksResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.common != null && Object.hasOwnProperty.call(message, "common"))
                $root.peer.GetCommonBlocksResponse.Common.encode(message.common, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified GetCommonBlocksResponse message, length delimited. Does not implicitly {@link peer.GetCommonBlocksResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof peer.GetCommonBlocksResponse
         * @static
         * @param {peer.IGetCommonBlocksResponse} message GetCommonBlocksResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetCommonBlocksResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a GetCommonBlocksResponse message from the specified reader or buffer.
         * @function decode
         * @memberof peer.GetCommonBlocksResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {peer.GetCommonBlocksResponse} GetCommonBlocksResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetCommonBlocksResponse.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.peer.GetCommonBlocksResponse();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.common = $root.peer.GetCommonBlocksResponse.Common.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GetCommonBlocksResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof peer.GetCommonBlocksResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {peer.GetCommonBlocksResponse} GetCommonBlocksResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetCommonBlocksResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GetCommonBlocksResponse message.
         * @function verify
         * @memberof peer.GetCommonBlocksResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GetCommonBlocksResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.common != null && message.hasOwnProperty("common")) {
                var error = $root.peer.GetCommonBlocksResponse.Common.verify(message.common);
                if (error)
                    return "common." + error;
            }
            return null;
        };

        /**
         * Creates a GetCommonBlocksResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof peer.GetCommonBlocksResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {peer.GetCommonBlocksResponse} GetCommonBlocksResponse
         */
        GetCommonBlocksResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.peer.GetCommonBlocksResponse)
                return object;
            var message = new $root.peer.GetCommonBlocksResponse();
            if (object.common != null) {
                if (typeof object.common !== "object")
                    throw TypeError(".peer.GetCommonBlocksResponse.common: object expected");
                message.common = $root.peer.GetCommonBlocksResponse.Common.fromObject(object.common);
            }
            return message;
        };

        /**
         * Creates a plain object from a GetCommonBlocksResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof peer.GetCommonBlocksResponse
         * @static
         * @param {peer.GetCommonBlocksResponse} message GetCommonBlocksResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GetCommonBlocksResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.common = null;
            if (message.common != null && message.hasOwnProperty("common"))
                object.common = $root.peer.GetCommonBlocksResponse.Common.toObject(message.common, options);
            return object;
        };

        /**
         * Converts this GetCommonBlocksResponse to JSON.
         * @function toJSON
         * @memberof peer.GetCommonBlocksResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GetCommonBlocksResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        GetCommonBlocksResponse.Common = (function() {

            /**
             * Properties of a Common.
             * @memberof peer.GetCommonBlocksResponse
             * @interface ICommon
             * @property {number|null} [height] Common height
             * @property {string|null} [id] Common id
             */

            /**
             * Constructs a new Common.
             * @memberof peer.GetCommonBlocksResponse
             * @classdesc Represents a Common.
             * @implements ICommon
             * @constructor
             * @param {peer.GetCommonBlocksResponse.ICommon=} [properties] Properties to set
             */
            function Common(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Common height.
             * @member {number} height
             * @memberof peer.GetCommonBlocksResponse.Common
             * @instance
             */
            Common.prototype.height = 0;

            /**
             * Common id.
             * @member {string} id
             * @memberof peer.GetCommonBlocksResponse.Common
             * @instance
             */
            Common.prototype.id = "";

            /**
             * Creates a new Common instance using the specified properties.
             * @function create
             * @memberof peer.GetCommonBlocksResponse.Common
             * @static
             * @param {peer.GetCommonBlocksResponse.ICommon=} [properties] Properties to set
             * @returns {peer.GetCommonBlocksResponse.Common} Common instance
             */
            Common.create = function create(properties) {
                return new Common(properties);
            };

            /**
             * Encodes the specified Common message. Does not implicitly {@link peer.GetCommonBlocksResponse.Common.verify|verify} messages.
             * @function encode
             * @memberof peer.GetCommonBlocksResponse.Common
             * @static
             * @param {peer.GetCommonBlocksResponse.ICommon} message Common message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Common.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.height != null && Object.hasOwnProperty.call(message, "height"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.height);
                if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.id);
                return writer;
            };

            /**
             * Encodes the specified Common message, length delimited. Does not implicitly {@link peer.GetCommonBlocksResponse.Common.verify|verify} messages.
             * @function encodeDelimited
             * @memberof peer.GetCommonBlocksResponse.Common
             * @static
             * @param {peer.GetCommonBlocksResponse.ICommon} message Common message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Common.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Common message from the specified reader or buffer.
             * @function decode
             * @memberof peer.GetCommonBlocksResponse.Common
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {peer.GetCommonBlocksResponse.Common} Common
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Common.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.peer.GetCommonBlocksResponse.Common();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.height = reader.uint32();
                        break;
                    case 2:
                        message.id = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Common message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof peer.GetCommonBlocksResponse.Common
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {peer.GetCommonBlocksResponse.Common} Common
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Common.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Common message.
             * @function verify
             * @memberof peer.GetCommonBlocksResponse.Common
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Common.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.height != null && message.hasOwnProperty("height"))
                    if (!$util.isInteger(message.height))
                        return "height: integer expected";
                if (message.id != null && message.hasOwnProperty("id"))
                    if (!$util.isString(message.id))
                        return "id: string expected";
                return null;
            };

            /**
             * Creates a Common message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof peer.GetCommonBlocksResponse.Common
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {peer.GetCommonBlocksResponse.Common} Common
             */
            Common.fromObject = function fromObject(object) {
                if (object instanceof $root.peer.GetCommonBlocksResponse.Common)
                    return object;
                var message = new $root.peer.GetCommonBlocksResponse.Common();
                if (object.height != null)
                    message.height = object.height >>> 0;
                if (object.id != null)
                    message.id = String(object.id);
                return message;
            };

            /**
             * Creates a plain object from a Common message. Also converts values to other types if specified.
             * @function toObject
             * @memberof peer.GetCommonBlocksResponse.Common
             * @static
             * @param {peer.GetCommonBlocksResponse.Common} message Common
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Common.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.height = 0;
                    object.id = "";
                }
                if (message.height != null && message.hasOwnProperty("height"))
                    object.height = message.height;
                if (message.id != null && message.hasOwnProperty("id"))
                    object.id = message.id;
                return object;
            };

            /**
             * Converts this Common to JSON.
             * @function toJSON
             * @memberof peer.GetCommonBlocksResponse.Common
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Common.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return Common;
        })();

        return GetCommonBlocksResponse;
    })();

    peer.GetStatusRequest = (function() {

        /**
         * Properties of a GetStatusRequest.
         * @memberof peer
         * @interface IGetStatusRequest
         * @property {shared.IHeaders|null} [headers] GetStatusRequest headers
         */

        /**
         * Constructs a new GetStatusRequest.
         * @memberof peer
         * @classdesc Represents a GetStatusRequest.
         * @implements IGetStatusRequest
         * @constructor
         * @param {peer.IGetStatusRequest=} [properties] Properties to set
         */
        function GetStatusRequest(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GetStatusRequest headers.
         * @member {shared.IHeaders|null|undefined} headers
         * @memberof peer.GetStatusRequest
         * @instance
         */
        GetStatusRequest.prototype.headers = null;

        /**
         * Creates a new GetStatusRequest instance using the specified properties.
         * @function create
         * @memberof peer.GetStatusRequest
         * @static
         * @param {peer.IGetStatusRequest=} [properties] Properties to set
         * @returns {peer.GetStatusRequest} GetStatusRequest instance
         */
        GetStatusRequest.create = function create(properties) {
            return new GetStatusRequest(properties);
        };

        /**
         * Encodes the specified GetStatusRequest message. Does not implicitly {@link peer.GetStatusRequest.verify|verify} messages.
         * @function encode
         * @memberof peer.GetStatusRequest
         * @static
         * @param {peer.IGetStatusRequest} message GetStatusRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetStatusRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.headers != null && Object.hasOwnProperty.call(message, "headers"))
                $root.shared.Headers.encode(message.headers, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified GetStatusRequest message, length delimited. Does not implicitly {@link peer.GetStatusRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof peer.GetStatusRequest
         * @static
         * @param {peer.IGetStatusRequest} message GetStatusRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetStatusRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a GetStatusRequest message from the specified reader or buffer.
         * @function decode
         * @memberof peer.GetStatusRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {peer.GetStatusRequest} GetStatusRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetStatusRequest.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.peer.GetStatusRequest();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.headers = $root.shared.Headers.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GetStatusRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof peer.GetStatusRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {peer.GetStatusRequest} GetStatusRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetStatusRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GetStatusRequest message.
         * @function verify
         * @memberof peer.GetStatusRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GetStatusRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.headers != null && message.hasOwnProperty("headers")) {
                var error = $root.shared.Headers.verify(message.headers);
                if (error)
                    return "headers." + error;
            }
            return null;
        };

        /**
         * Creates a GetStatusRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof peer.GetStatusRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {peer.GetStatusRequest} GetStatusRequest
         */
        GetStatusRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.peer.GetStatusRequest)
                return object;
            var message = new $root.peer.GetStatusRequest();
            if (object.headers != null) {
                if (typeof object.headers !== "object")
                    throw TypeError(".peer.GetStatusRequest.headers: object expected");
                message.headers = $root.shared.Headers.fromObject(object.headers);
            }
            return message;
        };

        /**
         * Creates a plain object from a GetStatusRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof peer.GetStatusRequest
         * @static
         * @param {peer.GetStatusRequest} message GetStatusRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GetStatusRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.headers = null;
            if (message.headers != null && message.hasOwnProperty("headers"))
                object.headers = $root.shared.Headers.toObject(message.headers, options);
            return object;
        };

        /**
         * Converts this GetStatusRequest to JSON.
         * @function toJSON
         * @memberof peer.GetStatusRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GetStatusRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return GetStatusRequest;
    })();

    peer.GetStatusResponse = (function() {

        /**
         * Properties of a GetStatusResponse.
         * @memberof peer
         * @interface IGetStatusResponse
         * @property {peer.GetStatusResponse.IState|null} [state] GetStatusResponse state
         * @property {peer.GetStatusResponse.IConfig|null} [config] GetStatusResponse config
         */

        /**
         * Constructs a new GetStatusResponse.
         * @memberof peer
         * @classdesc Represents a GetStatusResponse.
         * @implements IGetStatusResponse
         * @constructor
         * @param {peer.IGetStatusResponse=} [properties] Properties to set
         */
        function GetStatusResponse(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GetStatusResponse state.
         * @member {peer.GetStatusResponse.IState|null|undefined} state
         * @memberof peer.GetStatusResponse
         * @instance
         */
        GetStatusResponse.prototype.state = null;

        /**
         * GetStatusResponse config.
         * @member {peer.GetStatusResponse.IConfig|null|undefined} config
         * @memberof peer.GetStatusResponse
         * @instance
         */
        GetStatusResponse.prototype.config = null;

        /**
         * Creates a new GetStatusResponse instance using the specified properties.
         * @function create
         * @memberof peer.GetStatusResponse
         * @static
         * @param {peer.IGetStatusResponse=} [properties] Properties to set
         * @returns {peer.GetStatusResponse} GetStatusResponse instance
         */
        GetStatusResponse.create = function create(properties) {
            return new GetStatusResponse(properties);
        };

        /**
         * Encodes the specified GetStatusResponse message. Does not implicitly {@link peer.GetStatusResponse.verify|verify} messages.
         * @function encode
         * @memberof peer.GetStatusResponse
         * @static
         * @param {peer.IGetStatusResponse} message GetStatusResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetStatusResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.state != null && Object.hasOwnProperty.call(message, "state"))
                $root.peer.GetStatusResponse.State.encode(message.state, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.config != null && Object.hasOwnProperty.call(message, "config"))
                $root.peer.GetStatusResponse.Config.encode(message.config, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified GetStatusResponse message, length delimited. Does not implicitly {@link peer.GetStatusResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof peer.GetStatusResponse
         * @static
         * @param {peer.IGetStatusResponse} message GetStatusResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetStatusResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a GetStatusResponse message from the specified reader or buffer.
         * @function decode
         * @memberof peer.GetStatusResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {peer.GetStatusResponse} GetStatusResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetStatusResponse.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.peer.GetStatusResponse();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.state = $root.peer.GetStatusResponse.State.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.config = $root.peer.GetStatusResponse.Config.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GetStatusResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof peer.GetStatusResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {peer.GetStatusResponse} GetStatusResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetStatusResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GetStatusResponse message.
         * @function verify
         * @memberof peer.GetStatusResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GetStatusResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.state != null && message.hasOwnProperty("state")) {
                var error = $root.peer.GetStatusResponse.State.verify(message.state);
                if (error)
                    return "state." + error;
            }
            if (message.config != null && message.hasOwnProperty("config")) {
                var error = $root.peer.GetStatusResponse.Config.verify(message.config);
                if (error)
                    return "config." + error;
            }
            return null;
        };

        /**
         * Creates a GetStatusResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof peer.GetStatusResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {peer.GetStatusResponse} GetStatusResponse
         */
        GetStatusResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.peer.GetStatusResponse)
                return object;
            var message = new $root.peer.GetStatusResponse();
            if (object.state != null) {
                if (typeof object.state !== "object")
                    throw TypeError(".peer.GetStatusResponse.state: object expected");
                message.state = $root.peer.GetStatusResponse.State.fromObject(object.state);
            }
            if (object.config != null) {
                if (typeof object.config !== "object")
                    throw TypeError(".peer.GetStatusResponse.config: object expected");
                message.config = $root.peer.GetStatusResponse.Config.fromObject(object.config);
            }
            return message;
        };

        /**
         * Creates a plain object from a GetStatusResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof peer.GetStatusResponse
         * @static
         * @param {peer.GetStatusResponse} message GetStatusResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GetStatusResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.state = null;
                object.config = null;
            }
            if (message.state != null && message.hasOwnProperty("state"))
                object.state = $root.peer.GetStatusResponse.State.toObject(message.state, options);
            if (message.config != null && message.hasOwnProperty("config"))
                object.config = $root.peer.GetStatusResponse.Config.toObject(message.config, options);
            return object;
        };

        /**
         * Converts this GetStatusResponse to JSON.
         * @function toJSON
         * @memberof peer.GetStatusResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GetStatusResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        GetStatusResponse.State = (function() {

            /**
             * Properties of a State.
             * @memberof peer.GetStatusResponse
             * @interface IState
             * @property {number|null} [height] State height
             * @property {boolean|null} [forgingAllowed] State forgingAllowed
             * @property {number|null} [currentSlot] State currentSlot
             * @property {peer.GetStatusResponse.State.IBlockHeader|null} [header] State header
             */

            /**
             * Constructs a new State.
             * @memberof peer.GetStatusResponse
             * @classdesc Represents a State.
             * @implements IState
             * @constructor
             * @param {peer.GetStatusResponse.IState=} [properties] Properties to set
             */
            function State(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * State height.
             * @member {number} height
             * @memberof peer.GetStatusResponse.State
             * @instance
             */
            State.prototype.height = 0;

            /**
             * State forgingAllowed.
             * @member {boolean} forgingAllowed
             * @memberof peer.GetStatusResponse.State
             * @instance
             */
            State.prototype.forgingAllowed = false;

            /**
             * State currentSlot.
             * @member {number} currentSlot
             * @memberof peer.GetStatusResponse.State
             * @instance
             */
            State.prototype.currentSlot = 0;

            /**
             * State header.
             * @member {peer.GetStatusResponse.State.IBlockHeader|null|undefined} header
             * @memberof peer.GetStatusResponse.State
             * @instance
             */
            State.prototype.header = null;

            /**
             * Creates a new State instance using the specified properties.
             * @function create
             * @memberof peer.GetStatusResponse.State
             * @static
             * @param {peer.GetStatusResponse.IState=} [properties] Properties to set
             * @returns {peer.GetStatusResponse.State} State instance
             */
            State.create = function create(properties) {
                return new State(properties);
            };

            /**
             * Encodes the specified State message. Does not implicitly {@link peer.GetStatusResponse.State.verify|verify} messages.
             * @function encode
             * @memberof peer.GetStatusResponse.State
             * @static
             * @param {peer.GetStatusResponse.IState} message State message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            State.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.height != null && Object.hasOwnProperty.call(message, "height"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.height);
                if (message.forgingAllowed != null && Object.hasOwnProperty.call(message, "forgingAllowed"))
                    writer.uint32(/* id 2, wireType 0 =*/16).bool(message.forgingAllowed);
                if (message.currentSlot != null && Object.hasOwnProperty.call(message, "currentSlot"))
                    writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.currentSlot);
                if (message.header != null && Object.hasOwnProperty.call(message, "header"))
                    $root.peer.GetStatusResponse.State.BlockHeader.encode(message.header, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified State message, length delimited. Does not implicitly {@link peer.GetStatusResponse.State.verify|verify} messages.
             * @function encodeDelimited
             * @memberof peer.GetStatusResponse.State
             * @static
             * @param {peer.GetStatusResponse.IState} message State message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            State.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a State message from the specified reader or buffer.
             * @function decode
             * @memberof peer.GetStatusResponse.State
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {peer.GetStatusResponse.State} State
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            State.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.peer.GetStatusResponse.State();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.height = reader.uint32();
                        break;
                    case 2:
                        message.forgingAllowed = reader.bool();
                        break;
                    case 3:
                        message.currentSlot = reader.uint32();
                        break;
                    case 4:
                        message.header = $root.peer.GetStatusResponse.State.BlockHeader.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a State message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof peer.GetStatusResponse.State
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {peer.GetStatusResponse.State} State
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            State.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a State message.
             * @function verify
             * @memberof peer.GetStatusResponse.State
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            State.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.height != null && message.hasOwnProperty("height"))
                    if (!$util.isInteger(message.height))
                        return "height: integer expected";
                if (message.forgingAllowed != null && message.hasOwnProperty("forgingAllowed"))
                    if (typeof message.forgingAllowed !== "boolean")
                        return "forgingAllowed: boolean expected";
                if (message.currentSlot != null && message.hasOwnProperty("currentSlot"))
                    if (!$util.isInteger(message.currentSlot))
                        return "currentSlot: integer expected";
                if (message.header != null && message.hasOwnProperty("header")) {
                    var error = $root.peer.GetStatusResponse.State.BlockHeader.verify(message.header);
                    if (error)
                        return "header." + error;
                }
                return null;
            };

            /**
             * Creates a State message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof peer.GetStatusResponse.State
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {peer.GetStatusResponse.State} State
             */
            State.fromObject = function fromObject(object) {
                if (object instanceof $root.peer.GetStatusResponse.State)
                    return object;
                var message = new $root.peer.GetStatusResponse.State();
                if (object.height != null)
                    message.height = object.height >>> 0;
                if (object.forgingAllowed != null)
                    message.forgingAllowed = Boolean(object.forgingAllowed);
                if (object.currentSlot != null)
                    message.currentSlot = object.currentSlot >>> 0;
                if (object.header != null) {
                    if (typeof object.header !== "object")
                        throw TypeError(".peer.GetStatusResponse.State.header: object expected");
                    message.header = $root.peer.GetStatusResponse.State.BlockHeader.fromObject(object.header);
                }
                return message;
            };

            /**
             * Creates a plain object from a State message. Also converts values to other types if specified.
             * @function toObject
             * @memberof peer.GetStatusResponse.State
             * @static
             * @param {peer.GetStatusResponse.State} message State
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            State.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.height = 0;
                    object.forgingAllowed = false;
                    object.currentSlot = 0;
                    object.header = null;
                }
                if (message.height != null && message.hasOwnProperty("height"))
                    object.height = message.height;
                if (message.forgingAllowed != null && message.hasOwnProperty("forgingAllowed"))
                    object.forgingAllowed = message.forgingAllowed;
                if (message.currentSlot != null && message.hasOwnProperty("currentSlot"))
                    object.currentSlot = message.currentSlot;
                if (message.header != null && message.hasOwnProperty("header"))
                    object.header = $root.peer.GetStatusResponse.State.BlockHeader.toObject(message.header, options);
                return object;
            };

            /**
             * Converts this State to JSON.
             * @function toJSON
             * @memberof peer.GetStatusResponse.State
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            State.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            State.BlockHeader = (function() {

                /**
                 * Properties of a BlockHeader.
                 * @memberof peer.GetStatusResponse.State
                 * @interface IBlockHeader
                 * @property {string|null} [id] BlockHeader id
                 * @property {string|null} [idHex] BlockHeader idHex
                 * @property {number|null} [version] BlockHeader version
                 * @property {number|null} [timestamp] BlockHeader timestamp
                 * @property {string|null} [previousBlock] BlockHeader previousBlock
                 * @property {string|null} [previousBlockHex] BlockHeader previousBlockHex
                 * @property {number|null} [height] BlockHeader height
                 * @property {number|null} [numberOfTransactions] BlockHeader numberOfTransactions
                 * @property {string|null} [totalAmount] BlockHeader totalAmount
                 * @property {string|null} [totalFee] BlockHeader totalFee
                 * @property {string|null} [reward] BlockHeader reward
                 * @property {number|null} [payloadLength] BlockHeader payloadLength
                 * @property {string|null} [payloadHash] BlockHeader payloadHash
                 * @property {string|null} [generatorPublicKey] BlockHeader generatorPublicKey
                 * @property {string|null} [blockSignature] BlockHeader blockSignature
                 */

                /**
                 * Constructs a new BlockHeader.
                 * @memberof peer.GetStatusResponse.State
                 * @classdesc Represents a BlockHeader.
                 * @implements IBlockHeader
                 * @constructor
                 * @param {peer.GetStatusResponse.State.IBlockHeader=} [properties] Properties to set
                 */
                function BlockHeader(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * BlockHeader id.
                 * @member {string} id
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.id = "";

                /**
                 * BlockHeader idHex.
                 * @member {string} idHex
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.idHex = "";

                /**
                 * BlockHeader version.
                 * @member {number} version
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.version = 0;

                /**
                 * BlockHeader timestamp.
                 * @member {number} timestamp
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.timestamp = 0;

                /**
                 * BlockHeader previousBlock.
                 * @member {string} previousBlock
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.previousBlock = "";

                /**
                 * BlockHeader previousBlockHex.
                 * @member {string} previousBlockHex
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.previousBlockHex = "";

                /**
                 * BlockHeader height.
                 * @member {number} height
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.height = 0;

                /**
                 * BlockHeader numberOfTransactions.
                 * @member {number} numberOfTransactions
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.numberOfTransactions = 0;

                /**
                 * BlockHeader totalAmount.
                 * @member {string} totalAmount
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.totalAmount = "";

                /**
                 * BlockHeader totalFee.
                 * @member {string} totalFee
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.totalFee = "";

                /**
                 * BlockHeader reward.
                 * @member {string} reward
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.reward = "";

                /**
                 * BlockHeader payloadLength.
                 * @member {number} payloadLength
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.payloadLength = 0;

                /**
                 * BlockHeader payloadHash.
                 * @member {string} payloadHash
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.payloadHash = "";

                /**
                 * BlockHeader generatorPublicKey.
                 * @member {string} generatorPublicKey
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.generatorPublicKey = "";

                /**
                 * BlockHeader blockSignature.
                 * @member {string} blockSignature
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @instance
                 */
                BlockHeader.prototype.blockSignature = "";

                /**
                 * Creates a new BlockHeader instance using the specified properties.
                 * @function create
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @static
                 * @param {peer.GetStatusResponse.State.IBlockHeader=} [properties] Properties to set
                 * @returns {peer.GetStatusResponse.State.BlockHeader} BlockHeader instance
                 */
                BlockHeader.create = function create(properties) {
                    return new BlockHeader(properties);
                };

                /**
                 * Encodes the specified BlockHeader message. Does not implicitly {@link peer.GetStatusResponse.State.BlockHeader.verify|verify} messages.
                 * @function encode
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @static
                 * @param {peer.GetStatusResponse.State.IBlockHeader} message BlockHeader message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                BlockHeader.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                        writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
                    if (message.idHex != null && Object.hasOwnProperty.call(message, "idHex"))
                        writer.uint32(/* id 2, wireType 2 =*/18).string(message.idHex);
                    if (message.version != null && Object.hasOwnProperty.call(message, "version"))
                        writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.version);
                    if (message.timestamp != null && Object.hasOwnProperty.call(message, "timestamp"))
                        writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.timestamp);
                    if (message.previousBlock != null && Object.hasOwnProperty.call(message, "previousBlock"))
                        writer.uint32(/* id 5, wireType 2 =*/42).string(message.previousBlock);
                    if (message.previousBlockHex != null && Object.hasOwnProperty.call(message, "previousBlockHex"))
                        writer.uint32(/* id 6, wireType 2 =*/50).string(message.previousBlockHex);
                    if (message.height != null && Object.hasOwnProperty.call(message, "height"))
                        writer.uint32(/* id 7, wireType 0 =*/56).uint32(message.height);
                    if (message.numberOfTransactions != null && Object.hasOwnProperty.call(message, "numberOfTransactions"))
                        writer.uint32(/* id 8, wireType 0 =*/64).uint32(message.numberOfTransactions);
                    if (message.totalAmount != null && Object.hasOwnProperty.call(message, "totalAmount"))
                        writer.uint32(/* id 9, wireType 2 =*/74).string(message.totalAmount);
                    if (message.totalFee != null && Object.hasOwnProperty.call(message, "totalFee"))
                        writer.uint32(/* id 10, wireType 2 =*/82).string(message.totalFee);
                    if (message.reward != null && Object.hasOwnProperty.call(message, "reward"))
                        writer.uint32(/* id 11, wireType 2 =*/90).string(message.reward);
                    if (message.payloadLength != null && Object.hasOwnProperty.call(message, "payloadLength"))
                        writer.uint32(/* id 12, wireType 0 =*/96).uint32(message.payloadLength);
                    if (message.payloadHash != null && Object.hasOwnProperty.call(message, "payloadHash"))
                        writer.uint32(/* id 13, wireType 2 =*/106).string(message.payloadHash);
                    if (message.generatorPublicKey != null && Object.hasOwnProperty.call(message, "generatorPublicKey"))
                        writer.uint32(/* id 14, wireType 2 =*/114).string(message.generatorPublicKey);
                    if (message.blockSignature != null && Object.hasOwnProperty.call(message, "blockSignature"))
                        writer.uint32(/* id 15, wireType 2 =*/122).string(message.blockSignature);
                    return writer;
                };

                /**
                 * Encodes the specified BlockHeader message, length delimited. Does not implicitly {@link peer.GetStatusResponse.State.BlockHeader.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @static
                 * @param {peer.GetStatusResponse.State.IBlockHeader} message BlockHeader message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                BlockHeader.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a BlockHeader message from the specified reader or buffer.
                 * @function decode
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {peer.GetStatusResponse.State.BlockHeader} BlockHeader
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                BlockHeader.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    var end = length === undefined ? reader.len : reader.pos + length, message = new $root.peer.GetStatusResponse.State.BlockHeader();
                    while (reader.pos < end) {
                        var tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1:
                            message.id = reader.string();
                            break;
                        case 2:
                            message.idHex = reader.string();
                            break;
                        case 3:
                            message.version = reader.uint32();
                            break;
                        case 4:
                            message.timestamp = reader.uint32();
                            break;
                        case 5:
                            message.previousBlock = reader.string();
                            break;
                        case 6:
                            message.previousBlockHex = reader.string();
                            break;
                        case 7:
                            message.height = reader.uint32();
                            break;
                        case 8:
                            message.numberOfTransactions = reader.uint32();
                            break;
                        case 9:
                            message.totalAmount = reader.string();
                            break;
                        case 10:
                            message.totalFee = reader.string();
                            break;
                        case 11:
                            message.reward = reader.string();
                            break;
                        case 12:
                            message.payloadLength = reader.uint32();
                            break;
                        case 13:
                            message.payloadHash = reader.string();
                            break;
                        case 14:
                            message.generatorPublicKey = reader.string();
                            break;
                        case 15:
                            message.blockSignature = reader.string();
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a BlockHeader message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {peer.GetStatusResponse.State.BlockHeader} BlockHeader
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                BlockHeader.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a BlockHeader message.
                 * @function verify
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                BlockHeader.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.id != null && message.hasOwnProperty("id"))
                        if (!$util.isString(message.id))
                            return "id: string expected";
                    if (message.idHex != null && message.hasOwnProperty("idHex"))
                        if (!$util.isString(message.idHex))
                            return "idHex: string expected";
                    if (message.version != null && message.hasOwnProperty("version"))
                        if (!$util.isInteger(message.version))
                            return "version: integer expected";
                    if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                        if (!$util.isInteger(message.timestamp))
                            return "timestamp: integer expected";
                    if (message.previousBlock != null && message.hasOwnProperty("previousBlock"))
                        if (!$util.isString(message.previousBlock))
                            return "previousBlock: string expected";
                    if (message.previousBlockHex != null && message.hasOwnProperty("previousBlockHex"))
                        if (!$util.isString(message.previousBlockHex))
                            return "previousBlockHex: string expected";
                    if (message.height != null && message.hasOwnProperty("height"))
                        if (!$util.isInteger(message.height))
                            return "height: integer expected";
                    if (message.numberOfTransactions != null && message.hasOwnProperty("numberOfTransactions"))
                        if (!$util.isInteger(message.numberOfTransactions))
                            return "numberOfTransactions: integer expected";
                    if (message.totalAmount != null && message.hasOwnProperty("totalAmount"))
                        if (!$util.isString(message.totalAmount))
                            return "totalAmount: string expected";
                    if (message.totalFee != null && message.hasOwnProperty("totalFee"))
                        if (!$util.isString(message.totalFee))
                            return "totalFee: string expected";
                    if (message.reward != null && message.hasOwnProperty("reward"))
                        if (!$util.isString(message.reward))
                            return "reward: string expected";
                    if (message.payloadLength != null && message.hasOwnProperty("payloadLength"))
                        if (!$util.isInteger(message.payloadLength))
                            return "payloadLength: integer expected";
                    if (message.payloadHash != null && message.hasOwnProperty("payloadHash"))
                        if (!$util.isString(message.payloadHash))
                            return "payloadHash: string expected";
                    if (message.generatorPublicKey != null && message.hasOwnProperty("generatorPublicKey"))
                        if (!$util.isString(message.generatorPublicKey))
                            return "generatorPublicKey: string expected";
                    if (message.blockSignature != null && message.hasOwnProperty("blockSignature"))
                        if (!$util.isString(message.blockSignature))
                            return "blockSignature: string expected";
                    return null;
                };

                /**
                 * Creates a BlockHeader message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {peer.GetStatusResponse.State.BlockHeader} BlockHeader
                 */
                BlockHeader.fromObject = function fromObject(object) {
                    if (object instanceof $root.peer.GetStatusResponse.State.BlockHeader)
                        return object;
                    var message = new $root.peer.GetStatusResponse.State.BlockHeader();
                    if (object.id != null)
                        message.id = String(object.id);
                    if (object.idHex != null)
                        message.idHex = String(object.idHex);
                    if (object.version != null)
                        message.version = object.version >>> 0;
                    if (object.timestamp != null)
                        message.timestamp = object.timestamp >>> 0;
                    if (object.previousBlock != null)
                        message.previousBlock = String(object.previousBlock);
                    if (object.previousBlockHex != null)
                        message.previousBlockHex = String(object.previousBlockHex);
                    if (object.height != null)
                        message.height = object.height >>> 0;
                    if (object.numberOfTransactions != null)
                        message.numberOfTransactions = object.numberOfTransactions >>> 0;
                    if (object.totalAmount != null)
                        message.totalAmount = String(object.totalAmount);
                    if (object.totalFee != null)
                        message.totalFee = String(object.totalFee);
                    if (object.reward != null)
                        message.reward = String(object.reward);
                    if (object.payloadLength != null)
                        message.payloadLength = object.payloadLength >>> 0;
                    if (object.payloadHash != null)
                        message.payloadHash = String(object.payloadHash);
                    if (object.generatorPublicKey != null)
                        message.generatorPublicKey = String(object.generatorPublicKey);
                    if (object.blockSignature != null)
                        message.blockSignature = String(object.blockSignature);
                    return message;
                };

                /**
                 * Creates a plain object from a BlockHeader message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @static
                 * @param {peer.GetStatusResponse.State.BlockHeader} message BlockHeader
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                BlockHeader.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        object.id = "";
                        object.idHex = "";
                        object.version = 0;
                        object.timestamp = 0;
                        object.previousBlock = "";
                        object.previousBlockHex = "";
                        object.height = 0;
                        object.numberOfTransactions = 0;
                        object.totalAmount = "";
                        object.totalFee = "";
                        object.reward = "";
                        object.payloadLength = 0;
                        object.payloadHash = "";
                        object.generatorPublicKey = "";
                        object.blockSignature = "";
                    }
                    if (message.id != null && message.hasOwnProperty("id"))
                        object.id = message.id;
                    if (message.idHex != null && message.hasOwnProperty("idHex"))
                        object.idHex = message.idHex;
                    if (message.version != null && message.hasOwnProperty("version"))
                        object.version = message.version;
                    if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                        object.timestamp = message.timestamp;
                    if (message.previousBlock != null && message.hasOwnProperty("previousBlock"))
                        object.previousBlock = message.previousBlock;
                    if (message.previousBlockHex != null && message.hasOwnProperty("previousBlockHex"))
                        object.previousBlockHex = message.previousBlockHex;
                    if (message.height != null && message.hasOwnProperty("height"))
                        object.height = message.height;
                    if (message.numberOfTransactions != null && message.hasOwnProperty("numberOfTransactions"))
                        object.numberOfTransactions = message.numberOfTransactions;
                    if (message.totalAmount != null && message.hasOwnProperty("totalAmount"))
                        object.totalAmount = message.totalAmount;
                    if (message.totalFee != null && message.hasOwnProperty("totalFee"))
                        object.totalFee = message.totalFee;
                    if (message.reward != null && message.hasOwnProperty("reward"))
                        object.reward = message.reward;
                    if (message.payloadLength != null && message.hasOwnProperty("payloadLength"))
                        object.payloadLength = message.payloadLength;
                    if (message.payloadHash != null && message.hasOwnProperty("payloadHash"))
                        object.payloadHash = message.payloadHash;
                    if (message.generatorPublicKey != null && message.hasOwnProperty("generatorPublicKey"))
                        object.generatorPublicKey = message.generatorPublicKey;
                    if (message.blockSignature != null && message.hasOwnProperty("blockSignature"))
                        object.blockSignature = message.blockSignature;
                    return object;
                };

                /**
                 * Converts this BlockHeader to JSON.
                 * @function toJSON
                 * @memberof peer.GetStatusResponse.State.BlockHeader
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                BlockHeader.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return BlockHeader;
            })();

            return State;
        })();

        GetStatusResponse.Config = (function() {

            /**
             * Properties of a Config.
             * @memberof peer.GetStatusResponse
             * @interface IConfig
             * @property {string|null} [version] Config version
             * @property {peer.GetStatusResponse.Config.INetwork|null} [network] Config network
             * @property {Object.<string,peer.GetStatusResponse.Config.IPlugin>|null} [plugins] Config plugins
             */

            /**
             * Constructs a new Config.
             * @memberof peer.GetStatusResponse
             * @classdesc Represents a Config.
             * @implements IConfig
             * @constructor
             * @param {peer.GetStatusResponse.IConfig=} [properties] Properties to set
             */
            function Config(properties) {
                this.plugins = {};
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Config version.
             * @member {string} version
             * @memberof peer.GetStatusResponse.Config
             * @instance
             */
            Config.prototype.version = "";

            /**
             * Config network.
             * @member {peer.GetStatusResponse.Config.INetwork|null|undefined} network
             * @memberof peer.GetStatusResponse.Config
             * @instance
             */
            Config.prototype.network = null;

            /**
             * Config plugins.
             * @member {Object.<string,peer.GetStatusResponse.Config.IPlugin>} plugins
             * @memberof peer.GetStatusResponse.Config
             * @instance
             */
            Config.prototype.plugins = $util.emptyObject;

            /**
             * Creates a new Config instance using the specified properties.
             * @function create
             * @memberof peer.GetStatusResponse.Config
             * @static
             * @param {peer.GetStatusResponse.IConfig=} [properties] Properties to set
             * @returns {peer.GetStatusResponse.Config} Config instance
             */
            Config.create = function create(properties) {
                return new Config(properties);
            };

            /**
             * Encodes the specified Config message. Does not implicitly {@link peer.GetStatusResponse.Config.verify|verify} messages.
             * @function encode
             * @memberof peer.GetStatusResponse.Config
             * @static
             * @param {peer.GetStatusResponse.IConfig} message Config message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Config.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.version != null && Object.hasOwnProperty.call(message, "version"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.version);
                if (message.network != null && Object.hasOwnProperty.call(message, "network"))
                    $root.peer.GetStatusResponse.Config.Network.encode(message.network, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.plugins != null && Object.hasOwnProperty.call(message, "plugins"))
                    for (var keys = Object.keys(message.plugins), i = 0; i < keys.length; ++i) {
                        writer.uint32(/* id 3, wireType 2 =*/26).fork().uint32(/* id 1, wireType 2 =*/10).string(keys[i]);
                        $root.peer.GetStatusResponse.Config.Plugin.encode(message.plugins[keys[i]], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim().ldelim();
                    }
                return writer;
            };

            /**
             * Encodes the specified Config message, length delimited. Does not implicitly {@link peer.GetStatusResponse.Config.verify|verify} messages.
             * @function encodeDelimited
             * @memberof peer.GetStatusResponse.Config
             * @static
             * @param {peer.GetStatusResponse.IConfig} message Config message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Config.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Config message from the specified reader or buffer.
             * @function decode
             * @memberof peer.GetStatusResponse.Config
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {peer.GetStatusResponse.Config} Config
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Config.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.peer.GetStatusResponse.Config(), key, value;
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.version = reader.string();
                        break;
                    case 2:
                        message.network = $root.peer.GetStatusResponse.Config.Network.decode(reader, reader.uint32());
                        break;
                    case 3:
                        if (message.plugins === $util.emptyObject)
                            message.plugins = {};
                        var end2 = reader.uint32() + reader.pos;
                        key = "";
                        value = null;
                        while (reader.pos < end2) {
                            var tag2 = reader.uint32();
                            switch (tag2 >>> 3) {
                            case 1:
                                key = reader.string();
                                break;
                            case 2:
                                value = $root.peer.GetStatusResponse.Config.Plugin.decode(reader, reader.uint32());
                                break;
                            default:
                                reader.skipType(tag2 & 7);
                                break;
                            }
                        }
                        message.plugins[key] = value;
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Config message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof peer.GetStatusResponse.Config
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {peer.GetStatusResponse.Config} Config
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Config.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Config message.
             * @function verify
             * @memberof peer.GetStatusResponse.Config
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Config.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.version != null && message.hasOwnProperty("version"))
                    if (!$util.isString(message.version))
                        return "version: string expected";
                if (message.network != null && message.hasOwnProperty("network")) {
                    var error = $root.peer.GetStatusResponse.Config.Network.verify(message.network);
                    if (error)
                        return "network." + error;
                }
                if (message.plugins != null && message.hasOwnProperty("plugins")) {
                    if (!$util.isObject(message.plugins))
                        return "plugins: object expected";
                    var key = Object.keys(message.plugins);
                    for (var i = 0; i < key.length; ++i) {
                        var error = $root.peer.GetStatusResponse.Config.Plugin.verify(message.plugins[key[i]]);
                        if (error)
                            return "plugins." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a Config message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof peer.GetStatusResponse.Config
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {peer.GetStatusResponse.Config} Config
             */
            Config.fromObject = function fromObject(object) {
                if (object instanceof $root.peer.GetStatusResponse.Config)
                    return object;
                var message = new $root.peer.GetStatusResponse.Config();
                if (object.version != null)
                    message.version = String(object.version);
                if (object.network != null) {
                    if (typeof object.network !== "object")
                        throw TypeError(".peer.GetStatusResponse.Config.network: object expected");
                    message.network = $root.peer.GetStatusResponse.Config.Network.fromObject(object.network);
                }
                if (object.plugins) {
                    if (typeof object.plugins !== "object")
                        throw TypeError(".peer.GetStatusResponse.Config.plugins: object expected");
                    message.plugins = {};
                    for (var keys = Object.keys(object.plugins), i = 0; i < keys.length; ++i) {
                        if (typeof object.plugins[keys[i]] !== "object")
                            throw TypeError(".peer.GetStatusResponse.Config.plugins: object expected");
                        message.plugins[keys[i]] = $root.peer.GetStatusResponse.Config.Plugin.fromObject(object.plugins[keys[i]]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a Config message. Also converts values to other types if specified.
             * @function toObject
             * @memberof peer.GetStatusResponse.Config
             * @static
             * @param {peer.GetStatusResponse.Config} message Config
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Config.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.objects || options.defaults)
                    object.plugins = {};
                if (options.defaults) {
                    object.version = "";
                    object.network = null;
                }
                if (message.version != null && message.hasOwnProperty("version"))
                    object.version = message.version;
                if (message.network != null && message.hasOwnProperty("network"))
                    object.network = $root.peer.GetStatusResponse.Config.Network.toObject(message.network, options);
                var keys2;
                if (message.plugins && (keys2 = Object.keys(message.plugins)).length) {
                    object.plugins = {};
                    for (var j = 0; j < keys2.length; ++j)
                        object.plugins[keys2[j]] = $root.peer.GetStatusResponse.Config.Plugin.toObject(message.plugins[keys2[j]], options);
                }
                return object;
            };

            /**
             * Converts this Config to JSON.
             * @function toJSON
             * @memberof peer.GetStatusResponse.Config
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Config.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            Config.Network = (function() {

                /**
                 * Properties of a Network.
                 * @memberof peer.GetStatusResponse.Config
                 * @interface INetwork
                 * @property {string|null} [name] Network name
                 * @property {string|null} [nethash] Network nethash
                 * @property {string|null} [explorer] Network explorer
                 * @property {peer.GetStatusResponse.Config.Network.IToken|null} [token] Network token
                 * @property {number|null} [version] Network version
                 */

                /**
                 * Constructs a new Network.
                 * @memberof peer.GetStatusResponse.Config
                 * @classdesc Represents a Network.
                 * @implements INetwork
                 * @constructor
                 * @param {peer.GetStatusResponse.Config.INetwork=} [properties] Properties to set
                 */
                function Network(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * Network name.
                 * @member {string} name
                 * @memberof peer.GetStatusResponse.Config.Network
                 * @instance
                 */
                Network.prototype.name = "";

                /**
                 * Network nethash.
                 * @member {string} nethash
                 * @memberof peer.GetStatusResponse.Config.Network
                 * @instance
                 */
                Network.prototype.nethash = "";

                /**
                 * Network explorer.
                 * @member {string} explorer
                 * @memberof peer.GetStatusResponse.Config.Network
                 * @instance
                 */
                Network.prototype.explorer = "";

                /**
                 * Network token.
                 * @member {peer.GetStatusResponse.Config.Network.IToken|null|undefined} token
                 * @memberof peer.GetStatusResponse.Config.Network
                 * @instance
                 */
                Network.prototype.token = null;

                /**
                 * Network version.
                 * @member {number} version
                 * @memberof peer.GetStatusResponse.Config.Network
                 * @instance
                 */
                Network.prototype.version = 0;

                /**
                 * Creates a new Network instance using the specified properties.
                 * @function create
                 * @memberof peer.GetStatusResponse.Config.Network
                 * @static
                 * @param {peer.GetStatusResponse.Config.INetwork=} [properties] Properties to set
                 * @returns {peer.GetStatusResponse.Config.Network} Network instance
                 */
                Network.create = function create(properties) {
                    return new Network(properties);
                };

                /**
                 * Encodes the specified Network message. Does not implicitly {@link peer.GetStatusResponse.Config.Network.verify|verify} messages.
                 * @function encode
                 * @memberof peer.GetStatusResponse.Config.Network
                 * @static
                 * @param {peer.GetStatusResponse.Config.INetwork} message Network message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Network.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                        writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
                    if (message.nethash != null && Object.hasOwnProperty.call(message, "nethash"))
                        writer.uint32(/* id 2, wireType 2 =*/18).string(message.nethash);
                    if (message.explorer != null && Object.hasOwnProperty.call(message, "explorer"))
                        writer.uint32(/* id 3, wireType 2 =*/26).string(message.explorer);
                    if (message.token != null && Object.hasOwnProperty.call(message, "token"))
                        $root.peer.GetStatusResponse.Config.Network.Token.encode(message.token, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                    if (message.version != null && Object.hasOwnProperty.call(message, "version"))
                        writer.uint32(/* id 5, wireType 0 =*/40).uint32(message.version);
                    return writer;
                };

                /**
                 * Encodes the specified Network message, length delimited. Does not implicitly {@link peer.GetStatusResponse.Config.Network.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof peer.GetStatusResponse.Config.Network
                 * @static
                 * @param {peer.GetStatusResponse.Config.INetwork} message Network message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Network.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a Network message from the specified reader or buffer.
                 * @function decode
                 * @memberof peer.GetStatusResponse.Config.Network
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {peer.GetStatusResponse.Config.Network} Network
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Network.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    var end = length === undefined ? reader.len : reader.pos + length, message = new $root.peer.GetStatusResponse.Config.Network();
                    while (reader.pos < end) {
                        var tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1:
                            message.name = reader.string();
                            break;
                        case 2:
                            message.nethash = reader.string();
                            break;
                        case 3:
                            message.explorer = reader.string();
                            break;
                        case 4:
                            message.token = $root.peer.GetStatusResponse.Config.Network.Token.decode(reader, reader.uint32());
                            break;
                        case 5:
                            message.version = reader.uint32();
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a Network message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof peer.GetStatusResponse.Config.Network
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {peer.GetStatusResponse.Config.Network} Network
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Network.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a Network message.
                 * @function verify
                 * @memberof peer.GetStatusResponse.Config.Network
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                Network.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.name != null && message.hasOwnProperty("name"))
                        if (!$util.isString(message.name))
                            return "name: string expected";
                    if (message.nethash != null && message.hasOwnProperty("nethash"))
                        if (!$util.isString(message.nethash))
                            return "nethash: string expected";
                    if (message.explorer != null && message.hasOwnProperty("explorer"))
                        if (!$util.isString(message.explorer))
                            return "explorer: string expected";
                    if (message.token != null && message.hasOwnProperty("token")) {
                        var error = $root.peer.GetStatusResponse.Config.Network.Token.verify(message.token);
                        if (error)
                            return "token." + error;
                    }
                    if (message.version != null && message.hasOwnProperty("version"))
                        if (!$util.isInteger(message.version))
                            return "version: integer expected";
                    return null;
                };

                /**
                 * Creates a Network message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof peer.GetStatusResponse.Config.Network
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {peer.GetStatusResponse.Config.Network} Network
                 */
                Network.fromObject = function fromObject(object) {
                    if (object instanceof $root.peer.GetStatusResponse.Config.Network)
                        return object;
                    var message = new $root.peer.GetStatusResponse.Config.Network();
                    if (object.name != null)
                        message.name = String(object.name);
                    if (object.nethash != null)
                        message.nethash = String(object.nethash);
                    if (object.explorer != null)
                        message.explorer = String(object.explorer);
                    if (object.token != null) {
                        if (typeof object.token !== "object")
                            throw TypeError(".peer.GetStatusResponse.Config.Network.token: object expected");
                        message.token = $root.peer.GetStatusResponse.Config.Network.Token.fromObject(object.token);
                    }
                    if (object.version != null)
                        message.version = object.version >>> 0;
                    return message;
                };

                /**
                 * Creates a plain object from a Network message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof peer.GetStatusResponse.Config.Network
                 * @static
                 * @param {peer.GetStatusResponse.Config.Network} message Network
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Network.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        object.name = "";
                        object.nethash = "";
                        object.explorer = "";
                        object.token = null;
                        object.version = 0;
                    }
                    if (message.name != null && message.hasOwnProperty("name"))
                        object.name = message.name;
                    if (message.nethash != null && message.hasOwnProperty("nethash"))
                        object.nethash = message.nethash;
                    if (message.explorer != null && message.hasOwnProperty("explorer"))
                        object.explorer = message.explorer;
                    if (message.token != null && message.hasOwnProperty("token"))
                        object.token = $root.peer.GetStatusResponse.Config.Network.Token.toObject(message.token, options);
                    if (message.version != null && message.hasOwnProperty("version"))
                        object.version = message.version;
                    return object;
                };

                /**
                 * Converts this Network to JSON.
                 * @function toJSON
                 * @memberof peer.GetStatusResponse.Config.Network
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Network.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                Network.Token = (function() {

                    /**
                     * Properties of a Token.
                     * @memberof peer.GetStatusResponse.Config.Network
                     * @interface IToken
                     * @property {string|null} [name] Token name
                     * @property {string|null} [symbol] Token symbol
                     */

                    /**
                     * Constructs a new Token.
                     * @memberof peer.GetStatusResponse.Config.Network
                     * @classdesc Represents a Token.
                     * @implements IToken
                     * @constructor
                     * @param {peer.GetStatusResponse.Config.Network.IToken=} [properties] Properties to set
                     */
                    function Token(properties) {
                        if (properties)
                            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }

                    /**
                     * Token name.
                     * @member {string} name
                     * @memberof peer.GetStatusResponse.Config.Network.Token
                     * @instance
                     */
                    Token.prototype.name = "";

                    /**
                     * Token symbol.
                     * @member {string} symbol
                     * @memberof peer.GetStatusResponse.Config.Network.Token
                     * @instance
                     */
                    Token.prototype.symbol = "";

                    /**
                     * Creates a new Token instance using the specified properties.
                     * @function create
                     * @memberof peer.GetStatusResponse.Config.Network.Token
                     * @static
                     * @param {peer.GetStatusResponse.Config.Network.IToken=} [properties] Properties to set
                     * @returns {peer.GetStatusResponse.Config.Network.Token} Token instance
                     */
                    Token.create = function create(properties) {
                        return new Token(properties);
                    };

                    /**
                     * Encodes the specified Token message. Does not implicitly {@link peer.GetStatusResponse.Config.Network.Token.verify|verify} messages.
                     * @function encode
                     * @memberof peer.GetStatusResponse.Config.Network.Token
                     * @static
                     * @param {peer.GetStatusResponse.Config.Network.IToken} message Token message or plain object to encode
                     * @param {$protobuf.Writer} [writer] Writer to encode to
                     * @returns {$protobuf.Writer} Writer
                     */
                    Token.encode = function encode(message, writer) {
                        if (!writer)
                            writer = $Writer.create();
                        if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                            writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
                        if (message.symbol != null && Object.hasOwnProperty.call(message, "symbol"))
                            writer.uint32(/* id 2, wireType 2 =*/18).string(message.symbol);
                        return writer;
                    };

                    /**
                     * Encodes the specified Token message, length delimited. Does not implicitly {@link peer.GetStatusResponse.Config.Network.Token.verify|verify} messages.
                     * @function encodeDelimited
                     * @memberof peer.GetStatusResponse.Config.Network.Token
                     * @static
                     * @param {peer.GetStatusResponse.Config.Network.IToken} message Token message or plain object to encode
                     * @param {$protobuf.Writer} [writer] Writer to encode to
                     * @returns {$protobuf.Writer} Writer
                     */
                    Token.encodeDelimited = function encodeDelimited(message, writer) {
                        return this.encode(message, writer).ldelim();
                    };

                    /**
                     * Decodes a Token message from the specified reader or buffer.
                     * @function decode
                     * @memberof peer.GetStatusResponse.Config.Network.Token
                     * @static
                     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                     * @param {number} [length] Message length if known beforehand
                     * @returns {peer.GetStatusResponse.Config.Network.Token} Token
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    Token.decode = function decode(reader, length) {
                        if (!(reader instanceof $Reader))
                            reader = $Reader.create(reader);
                        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.peer.GetStatusResponse.Config.Network.Token();
                        while (reader.pos < end) {
                            var tag = reader.uint32();
                            switch (tag >>> 3) {
                            case 1:
                                message.name = reader.string();
                                break;
                            case 2:
                                message.symbol = reader.string();
                                break;
                            default:
                                reader.skipType(tag & 7);
                                break;
                            }
                        }
                        return message;
                    };

                    /**
                     * Decodes a Token message from the specified reader or buffer, length delimited.
                     * @function decodeDelimited
                     * @memberof peer.GetStatusResponse.Config.Network.Token
                     * @static
                     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                     * @returns {peer.GetStatusResponse.Config.Network.Token} Token
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    Token.decodeDelimited = function decodeDelimited(reader) {
                        if (!(reader instanceof $Reader))
                            reader = new $Reader(reader);
                        return this.decode(reader, reader.uint32());
                    };

                    /**
                     * Verifies a Token message.
                     * @function verify
                     * @memberof peer.GetStatusResponse.Config.Network.Token
                     * @static
                     * @param {Object.<string,*>} message Plain object to verify
                     * @returns {string|null} `null` if valid, otherwise the reason why it is not
                     */
                    Token.verify = function verify(message) {
                        if (typeof message !== "object" || message === null)
                            return "object expected";
                        if (message.name != null && message.hasOwnProperty("name"))
                            if (!$util.isString(message.name))
                                return "name: string expected";
                        if (message.symbol != null && message.hasOwnProperty("symbol"))
                            if (!$util.isString(message.symbol))
                                return "symbol: string expected";
                        return null;
                    };

                    /**
                     * Creates a Token message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof peer.GetStatusResponse.Config.Network.Token
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {peer.GetStatusResponse.Config.Network.Token} Token
                     */
                    Token.fromObject = function fromObject(object) {
                        if (object instanceof $root.peer.GetStatusResponse.Config.Network.Token)
                            return object;
                        var message = new $root.peer.GetStatusResponse.Config.Network.Token();
                        if (object.name != null)
                            message.name = String(object.name);
                        if (object.symbol != null)
                            message.symbol = String(object.symbol);
                        return message;
                    };

                    /**
                     * Creates a plain object from a Token message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof peer.GetStatusResponse.Config.Network.Token
                     * @static
                     * @param {peer.GetStatusResponse.Config.Network.Token} message Token
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    Token.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        var object = {};
                        if (options.defaults) {
                            object.name = "";
                            object.symbol = "";
                        }
                        if (message.name != null && message.hasOwnProperty("name"))
                            object.name = message.name;
                        if (message.symbol != null && message.hasOwnProperty("symbol"))
                            object.symbol = message.symbol;
                        return object;
                    };

                    /**
                     * Converts this Token to JSON.
                     * @function toJSON
                     * @memberof peer.GetStatusResponse.Config.Network.Token
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    Token.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };

                    return Token;
                })();

                return Network;
            })();

            Config.Plugin = (function() {

                /**
                 * Properties of a Plugin.
                 * @memberof peer.GetStatusResponse.Config
                 * @interface IPlugin
                 * @property {number|null} [port] Plugin port
                 * @property {boolean|null} [enabled] Plugin enabled
                 * @property {boolean|null} [estimateTotalCount] Plugin estimateTotalCount
                 */

                /**
                 * Constructs a new Plugin.
                 * @memberof peer.GetStatusResponse.Config
                 * @classdesc Represents a Plugin.
                 * @implements IPlugin
                 * @constructor
                 * @param {peer.GetStatusResponse.Config.IPlugin=} [properties] Properties to set
                 */
                function Plugin(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * Plugin port.
                 * @member {number} port
                 * @memberof peer.GetStatusResponse.Config.Plugin
                 * @instance
                 */
                Plugin.prototype.port = 0;

                /**
                 * Plugin enabled.
                 * @member {boolean} enabled
                 * @memberof peer.GetStatusResponse.Config.Plugin
                 * @instance
                 */
                Plugin.prototype.enabled = false;

                /**
                 * Plugin estimateTotalCount.
                 * @member {boolean} estimateTotalCount
                 * @memberof peer.GetStatusResponse.Config.Plugin
                 * @instance
                 */
                Plugin.prototype.estimateTotalCount = false;

                /**
                 * Creates a new Plugin instance using the specified properties.
                 * @function create
                 * @memberof peer.GetStatusResponse.Config.Plugin
                 * @static
                 * @param {peer.GetStatusResponse.Config.IPlugin=} [properties] Properties to set
                 * @returns {peer.GetStatusResponse.Config.Plugin} Plugin instance
                 */
                Plugin.create = function create(properties) {
                    return new Plugin(properties);
                };

                /**
                 * Encodes the specified Plugin message. Does not implicitly {@link peer.GetStatusResponse.Config.Plugin.verify|verify} messages.
                 * @function encode
                 * @memberof peer.GetStatusResponse.Config.Plugin
                 * @static
                 * @param {peer.GetStatusResponse.Config.IPlugin} message Plugin message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Plugin.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.port != null && Object.hasOwnProperty.call(message, "port"))
                        writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.port);
                    if (message.enabled != null && Object.hasOwnProperty.call(message, "enabled"))
                        writer.uint32(/* id 2, wireType 0 =*/16).bool(message.enabled);
                    if (message.estimateTotalCount != null && Object.hasOwnProperty.call(message, "estimateTotalCount"))
                        writer.uint32(/* id 3, wireType 0 =*/24).bool(message.estimateTotalCount);
                    return writer;
                };

                /**
                 * Encodes the specified Plugin message, length delimited. Does not implicitly {@link peer.GetStatusResponse.Config.Plugin.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof peer.GetStatusResponse.Config.Plugin
                 * @static
                 * @param {peer.GetStatusResponse.Config.IPlugin} message Plugin message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Plugin.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a Plugin message from the specified reader or buffer.
                 * @function decode
                 * @memberof peer.GetStatusResponse.Config.Plugin
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {peer.GetStatusResponse.Config.Plugin} Plugin
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Plugin.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    var end = length === undefined ? reader.len : reader.pos + length, message = new $root.peer.GetStatusResponse.Config.Plugin();
                    while (reader.pos < end) {
                        var tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1:
                            message.port = reader.uint32();
                            break;
                        case 2:
                            message.enabled = reader.bool();
                            break;
                        case 3:
                            message.estimateTotalCount = reader.bool();
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a Plugin message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof peer.GetStatusResponse.Config.Plugin
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {peer.GetStatusResponse.Config.Plugin} Plugin
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Plugin.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a Plugin message.
                 * @function verify
                 * @memberof peer.GetStatusResponse.Config.Plugin
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                Plugin.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.port != null && message.hasOwnProperty("port"))
                        if (!$util.isInteger(message.port))
                            return "port: integer expected";
                    if (message.enabled != null && message.hasOwnProperty("enabled"))
                        if (typeof message.enabled !== "boolean")
                            return "enabled: boolean expected";
                    if (message.estimateTotalCount != null && message.hasOwnProperty("estimateTotalCount"))
                        if (typeof message.estimateTotalCount !== "boolean")
                            return "estimateTotalCount: boolean expected";
                    return null;
                };

                /**
                 * Creates a Plugin message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof peer.GetStatusResponse.Config.Plugin
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {peer.GetStatusResponse.Config.Plugin} Plugin
                 */
                Plugin.fromObject = function fromObject(object) {
                    if (object instanceof $root.peer.GetStatusResponse.Config.Plugin)
                        return object;
                    var message = new $root.peer.GetStatusResponse.Config.Plugin();
                    if (object.port != null)
                        message.port = object.port >>> 0;
                    if (object.enabled != null)
                        message.enabled = Boolean(object.enabled);
                    if (object.estimateTotalCount != null)
                        message.estimateTotalCount = Boolean(object.estimateTotalCount);
                    return message;
                };

                /**
                 * Creates a plain object from a Plugin message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof peer.GetStatusResponse.Config.Plugin
                 * @static
                 * @param {peer.GetStatusResponse.Config.Plugin} message Plugin
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Plugin.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults) {
                        object.port = 0;
                        object.enabled = false;
                        object.estimateTotalCount = false;
                    }
                    if (message.port != null && message.hasOwnProperty("port"))
                        object.port = message.port;
                    if (message.enabled != null && message.hasOwnProperty("enabled"))
                        object.enabled = message.enabled;
                    if (message.estimateTotalCount != null && message.hasOwnProperty("estimateTotalCount"))
                        object.estimateTotalCount = message.estimateTotalCount;
                    return object;
                };

                /**
                 * Converts this Plugin to JSON.
                 * @function toJSON
                 * @memberof peer.GetStatusResponse.Config.Plugin
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Plugin.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return Plugin;
            })();

            return Config;
        })();

        return GetStatusResponse;
    })();

    return peer;
})();

$root.shared = (function() {

    /**
     * Namespace shared.
     * @exports shared
     * @namespace
     */
    var shared = {};

    shared.Headers = (function() {

        /**
         * Properties of a Headers.
         * @memberof shared
         * @interface IHeaders
         * @property {string|null} [version] Headers version
         */

        /**
         * Constructs a new Headers.
         * @memberof shared
         * @classdesc Represents a Headers.
         * @implements IHeaders
         * @constructor
         * @param {shared.IHeaders=} [properties] Properties to set
         */
        function Headers(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Headers version.
         * @member {string} version
         * @memberof shared.Headers
         * @instance
         */
        Headers.prototype.version = "";

        /**
         * Creates a new Headers instance using the specified properties.
         * @function create
         * @memberof shared.Headers
         * @static
         * @param {shared.IHeaders=} [properties] Properties to set
         * @returns {shared.Headers} Headers instance
         */
        Headers.create = function create(properties) {
            return new Headers(properties);
        };

        /**
         * Encodes the specified Headers message. Does not implicitly {@link shared.Headers.verify|verify} messages.
         * @function encode
         * @memberof shared.Headers
         * @static
         * @param {shared.IHeaders} message Headers message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Headers.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.version != null && Object.hasOwnProperty.call(message, "version"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.version);
            return writer;
        };

        /**
         * Encodes the specified Headers message, length delimited. Does not implicitly {@link shared.Headers.verify|verify} messages.
         * @function encodeDelimited
         * @memberof shared.Headers
         * @static
         * @param {shared.IHeaders} message Headers message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Headers.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Headers message from the specified reader or buffer.
         * @function decode
         * @memberof shared.Headers
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {shared.Headers} Headers
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Headers.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.shared.Headers();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.version = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Headers message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof shared.Headers
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {shared.Headers} Headers
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Headers.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Headers message.
         * @function verify
         * @memberof shared.Headers
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Headers.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.version != null && message.hasOwnProperty("version"))
                if (!$util.isString(message.version))
                    return "version: string expected";
            return null;
        };

        /**
         * Creates a Headers message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof shared.Headers
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {shared.Headers} Headers
         */
        Headers.fromObject = function fromObject(object) {
            if (object instanceof $root.shared.Headers)
                return object;
            var message = new $root.shared.Headers();
            if (object.version != null)
                message.version = String(object.version);
            return message;
        };

        /**
         * Creates a plain object from a Headers message. Also converts values to other types if specified.
         * @function toObject
         * @memberof shared.Headers
         * @static
         * @param {shared.Headers} message Headers
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Headers.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.version = "";
            if (message.version != null && message.hasOwnProperty("version"))
                object.version = message.version;
            return object;
        };

        /**
         * Converts this Headers to JSON.
         * @function toJSON
         * @memberof shared.Headers
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Headers.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Headers;
    })();

    return shared;
})();

$root.transactions = (function() {

    /**
     * Namespace transactions.
     * @exports transactions
     * @namespace
     */
    var transactions = {};

    transactions.PostTransactionsRequest = (function() {

        /**
         * Properties of a PostTransactionsRequest.
         * @memberof transactions
         * @interface IPostTransactionsRequest
         * @property {Uint8Array|null} [transactions] PostTransactionsRequest transactions
         * @property {shared.IHeaders|null} [headers] PostTransactionsRequest headers
         */

        /**
         * Constructs a new PostTransactionsRequest.
         * @memberof transactions
         * @classdesc Represents a PostTransactionsRequest.
         * @implements IPostTransactionsRequest
         * @constructor
         * @param {transactions.IPostTransactionsRequest=} [properties] Properties to set
         */
        function PostTransactionsRequest(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PostTransactionsRequest transactions.
         * @member {Uint8Array} transactions
         * @memberof transactions.PostTransactionsRequest
         * @instance
         */
        PostTransactionsRequest.prototype.transactions = $util.newBuffer([]);

        /**
         * PostTransactionsRequest headers.
         * @member {shared.IHeaders|null|undefined} headers
         * @memberof transactions.PostTransactionsRequest
         * @instance
         */
        PostTransactionsRequest.prototype.headers = null;

        /**
         * Creates a new PostTransactionsRequest instance using the specified properties.
         * @function create
         * @memberof transactions.PostTransactionsRequest
         * @static
         * @param {transactions.IPostTransactionsRequest=} [properties] Properties to set
         * @returns {transactions.PostTransactionsRequest} PostTransactionsRequest instance
         */
        PostTransactionsRequest.create = function create(properties) {
            return new PostTransactionsRequest(properties);
        };

        /**
         * Encodes the specified PostTransactionsRequest message. Does not implicitly {@link transactions.PostTransactionsRequest.verify|verify} messages.
         * @function encode
         * @memberof transactions.PostTransactionsRequest
         * @static
         * @param {transactions.IPostTransactionsRequest} message PostTransactionsRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PostTransactionsRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.transactions != null && Object.hasOwnProperty.call(message, "transactions"))
                writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.transactions);
            if (message.headers != null && Object.hasOwnProperty.call(message, "headers"))
                $root.shared.Headers.encode(message.headers, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified PostTransactionsRequest message, length delimited. Does not implicitly {@link transactions.PostTransactionsRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof transactions.PostTransactionsRequest
         * @static
         * @param {transactions.IPostTransactionsRequest} message PostTransactionsRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PostTransactionsRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PostTransactionsRequest message from the specified reader or buffer.
         * @function decode
         * @memberof transactions.PostTransactionsRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {transactions.PostTransactionsRequest} PostTransactionsRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PostTransactionsRequest.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.transactions.PostTransactionsRequest();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.transactions = reader.bytes();
                    break;
                case 2:
                    message.headers = $root.shared.Headers.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a PostTransactionsRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof transactions.PostTransactionsRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {transactions.PostTransactionsRequest} PostTransactionsRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PostTransactionsRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PostTransactionsRequest message.
         * @function verify
         * @memberof transactions.PostTransactionsRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PostTransactionsRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.transactions != null && message.hasOwnProperty("transactions"))
                if (!(message.transactions && typeof message.transactions.length === "number" || $util.isString(message.transactions)))
                    return "transactions: buffer expected";
            if (message.headers != null && message.hasOwnProperty("headers")) {
                var error = $root.shared.Headers.verify(message.headers);
                if (error)
                    return "headers." + error;
            }
            return null;
        };

        /**
         * Creates a PostTransactionsRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof transactions.PostTransactionsRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {transactions.PostTransactionsRequest} PostTransactionsRequest
         */
        PostTransactionsRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.transactions.PostTransactionsRequest)
                return object;
            var message = new $root.transactions.PostTransactionsRequest();
            if (object.transactions != null)
                if (typeof object.transactions === "string")
                    $util.base64.decode(object.transactions, message.transactions = $util.newBuffer($util.base64.length(object.transactions)), 0);
                else if (object.transactions.length)
                    message.transactions = object.transactions;
            if (object.headers != null) {
                if (typeof object.headers !== "object")
                    throw TypeError(".transactions.PostTransactionsRequest.headers: object expected");
                message.headers = $root.shared.Headers.fromObject(object.headers);
            }
            return message;
        };

        /**
         * Creates a plain object from a PostTransactionsRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof transactions.PostTransactionsRequest
         * @static
         * @param {transactions.PostTransactionsRequest} message PostTransactionsRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PostTransactionsRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                if (options.bytes === String)
                    object.transactions = "";
                else {
                    object.transactions = [];
                    if (options.bytes !== Array)
                        object.transactions = $util.newBuffer(object.transactions);
                }
                object.headers = null;
            }
            if (message.transactions != null && message.hasOwnProperty("transactions"))
                object.transactions = options.bytes === String ? $util.base64.encode(message.transactions, 0, message.transactions.length) : options.bytes === Array ? Array.prototype.slice.call(message.transactions) : message.transactions;
            if (message.headers != null && message.hasOwnProperty("headers"))
                object.headers = $root.shared.Headers.toObject(message.headers, options);
            return object;
        };

        /**
         * Converts this PostTransactionsRequest to JSON.
         * @function toJSON
         * @memberof transactions.PostTransactionsRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PostTransactionsRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return PostTransactionsRequest;
    })();

    transactions.PostTransactionsResponse = (function() {

        /**
         * Properties of a PostTransactionsResponse.
         * @memberof transactions
         * @interface IPostTransactionsResponse
         * @property {Array.<string>|null} [accept] PostTransactionsResponse accept
         */

        /**
         * Constructs a new PostTransactionsResponse.
         * @memberof transactions
         * @classdesc Represents a PostTransactionsResponse.
         * @implements IPostTransactionsResponse
         * @constructor
         * @param {transactions.IPostTransactionsResponse=} [properties] Properties to set
         */
        function PostTransactionsResponse(properties) {
            this.accept = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PostTransactionsResponse accept.
         * @member {Array.<string>} accept
         * @memberof transactions.PostTransactionsResponse
         * @instance
         */
        PostTransactionsResponse.prototype.accept = $util.emptyArray;

        /**
         * Creates a new PostTransactionsResponse instance using the specified properties.
         * @function create
         * @memberof transactions.PostTransactionsResponse
         * @static
         * @param {transactions.IPostTransactionsResponse=} [properties] Properties to set
         * @returns {transactions.PostTransactionsResponse} PostTransactionsResponse instance
         */
        PostTransactionsResponse.create = function create(properties) {
            return new PostTransactionsResponse(properties);
        };

        /**
         * Encodes the specified PostTransactionsResponse message. Does not implicitly {@link transactions.PostTransactionsResponse.verify|verify} messages.
         * @function encode
         * @memberof transactions.PostTransactionsResponse
         * @static
         * @param {transactions.IPostTransactionsResponse} message PostTransactionsResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PostTransactionsResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.accept != null && message.accept.length)
                for (var i = 0; i < message.accept.length; ++i)
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.accept[i]);
            return writer;
        };

        /**
         * Encodes the specified PostTransactionsResponse message, length delimited. Does not implicitly {@link transactions.PostTransactionsResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof transactions.PostTransactionsResponse
         * @static
         * @param {transactions.IPostTransactionsResponse} message PostTransactionsResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PostTransactionsResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PostTransactionsResponse message from the specified reader or buffer.
         * @function decode
         * @memberof transactions.PostTransactionsResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {transactions.PostTransactionsResponse} PostTransactionsResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PostTransactionsResponse.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.transactions.PostTransactionsResponse();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.accept && message.accept.length))
                        message.accept = [];
                    message.accept.push(reader.string());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a PostTransactionsResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof transactions.PostTransactionsResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {transactions.PostTransactionsResponse} PostTransactionsResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PostTransactionsResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PostTransactionsResponse message.
         * @function verify
         * @memberof transactions.PostTransactionsResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PostTransactionsResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.accept != null && message.hasOwnProperty("accept")) {
                if (!Array.isArray(message.accept))
                    return "accept: array expected";
                for (var i = 0; i < message.accept.length; ++i)
                    if (!$util.isString(message.accept[i]))
                        return "accept: string[] expected";
            }
            return null;
        };

        /**
         * Creates a PostTransactionsResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof transactions.PostTransactionsResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {transactions.PostTransactionsResponse} PostTransactionsResponse
         */
        PostTransactionsResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.transactions.PostTransactionsResponse)
                return object;
            var message = new $root.transactions.PostTransactionsResponse();
            if (object.accept) {
                if (!Array.isArray(object.accept))
                    throw TypeError(".transactions.PostTransactionsResponse.accept: array expected");
                message.accept = [];
                for (var i = 0; i < object.accept.length; ++i)
                    message.accept[i] = String(object.accept[i]);
            }
            return message;
        };

        /**
         * Creates a plain object from a PostTransactionsResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof transactions.PostTransactionsResponse
         * @static
         * @param {transactions.PostTransactionsResponse} message PostTransactionsResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PostTransactionsResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.accept = [];
            if (message.accept && message.accept.length) {
                object.accept = [];
                for (var j = 0; j < message.accept.length; ++j)
                    object.accept[j] = message.accept[j];
            }
            return object;
        };

        /**
         * Converts this PostTransactionsResponse to JSON.
         * @function toJSON
         * @memberof transactions.PostTransactionsResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PostTransactionsResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return PostTransactionsResponse;
    })();

    return transactions;
})();

module.exports = $root;
