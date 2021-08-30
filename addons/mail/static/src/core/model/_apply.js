
/** @odoo-module **/

import { _store } from '@mail/core/model/_store';

import { remove } from '@mail/core/node/remove';

/**
 * Insert changes & removals in the model store.
 *
 * @param {Object} param0
 * @param {Object} param0.changes
 * @param {Object} [param0.changes.models]
 * @param {Object} [param0.changes.nodeToPrimitive]
 * @param {Object} [param0.changes.primitives]
 * @param {Object} [param0.changes.records]
 * @param {Object} param0.removals
 * @param {Object} [param0.removals.models]
 * @param {Object} [param0.removals.nodeToPrimitive]
 * @param {Object} [param0.removals.primitives]
 * @param {Object} [param0.removals.records]
 */
export function _apply(transaction) {
    const transaction2 = {
        changes: {
            models: { ...(transaction?.changes?.models ?? {}) },
            nodeToPrimitive: { ...(transaction?.changes?.nodeToPrimitive ?? {}) },
            primitives: { ...(transaction?.changes?.primitives ?? {}) },
            records: { ...(transaction?.changes?.records ?? {}) },
        },
        removals: {
            models: { ...(transaction?.removals?.models ?? {}) },
            nodeToPrimitive: { ...(transaction?.removals?.nodeToPrimitive ?? {}) },
            primitives: { ...(transaction?.removals?.primitives ?? {}) },
            records: { ...(transaction?.removals?.records ?? {}) },
        },
    };
    _store.models = {
        ..._store.models,
        ...transaction2.changes.models,
    };
    _store.nodeToPrimitive = {
        ..._store.models,
        ...transaction2.changes.nodeToPrimitive,
    };
    _store.primitives = {
        ..._store.primitives,
        ...transaction2.changes.primitives,
    };
    _store.records = {
        ..._store.records,
        ...transaction2.changes.records,
    };
    for (const name in transaction2.removals.models) {
        delete _store.models[name];
    }
    for (const value in transaction2.removals.primitives) {
        delete _store.primitives[value];
    }
    for (const $record in transaction2.removals.records) {
        delete _store.records[$record];
        remove($record);
    }
}
