import { uuid4 } from '@sentry/utils';
export var TRACEPARENT_REGEXP = /^[ \t]*([0-9a-f]{32})?-?([0-9a-f]{16})?-?([01])?[ \t]*$/;
/**
 * Span containg all data about a span
 */
var Span = /** @class */ (function () {
    function Span(_traceId, _spanId, _sampled, _parent) {
        if (_traceId === void 0) { _traceId = uuid4(); }
        if (_spanId === void 0) { _spanId = uuid4().substring(16); }
        this._traceId = _traceId;
        this._spanId = _spanId;
        this._sampled = _sampled;
        this._parent = _parent;
    }
    /**
     * Setter for parent
     */
    Span.prototype.setParent = function (parent) {
        this._parent = parent;
        return this;
    };
    /**
     * Setter for sampled
     */
    Span.prototype.setSampled = function (sampled) {
        this._sampled = sampled;
        return this;
    };
    /**
     * Continues a trace
     * @param traceparent Traceparent string
     */
    Span.fromTraceparent = function (traceparent) {
        var matches = traceparent.match(TRACEPARENT_REGEXP);
        if (matches) {
            var sampled = void 0;
            if (matches[3] === '1') {
                sampled = true;
            }
            else if (matches[3] === '0') {
                sampled = false;
            }
            var parent_1 = new Span(matches[1], matches[2], sampled);
            return new Span(matches[1], undefined, sampled, parent_1);
        }
        return undefined;
    };
    /**
     * @inheritDoc
     */
    Span.prototype.toTraceparent = function () {
        var sampled = '';
        if (this._sampled === true) {
            sampled = '-1';
        }
        else if (this._sampled === false) {
            sampled = '-0';
        }
        return this._traceId + "-" + this._spanId + sampled;
    };
    /**
     * @inheritDoc
     */
    Span.prototype.toJSON = function () {
        return {
            parent: (this._parent && this._parent.toJSON()) || undefined,
            sampled: this._sampled,
            span_id: this._spanId,
            trace_id: this._traceId,
        };
    };
    return Span;
}());
export { Span };
//# sourceMappingURL=span.js.map