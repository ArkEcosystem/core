export function transform(model) {
    return {
        id: model.id,
        event: model.event,
        target: model.target,
        token: model.token,
        enabled: model.enabled,
        conditions: model.conditions,
    };
}
