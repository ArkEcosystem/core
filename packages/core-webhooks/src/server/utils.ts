import Boom from "boom";

export function transformResource(model) {
    return {
        id: model.id,
        event: model.event,
        target: model.target,
        token: model.token,
        enabled: model.enabled,
        conditions: model.conditions,
    };
}

export function paginate(request) {
    return {
        offset: (request.query.page - 1) * request.query.limit,
        limit: request.query.limit,
    };
}

export function respondWithResource(data) {
    return data ? { data: transformResource(data) } : Boom.notFound();
}

export function toPagination(data) {
    return {
        results: data.rows.map(d => transformResource(d)),
        totalCount: data.count,
    };
}
