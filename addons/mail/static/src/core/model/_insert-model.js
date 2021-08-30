
/** @odoo-module **/

import { _apply } from '@mail/core/model/_apply';
import { _insertPrimitive } from '@mail/core/model/_insert-primitive';
import { _store } from '@mail/core/model/_store';

import { insert } from '@mail/core/node/insert';
import { link } from '@mail/core/node/link';

/**
 * Insert the model with provided data
 *
 * @param {Context} ctx 
 * @param {Object} data 
 * @returns {NodeId}
 */
export function _insertModel(ctx, data) {
    const data2 = { ...data };
    const name = data2['Model/name'];
    delete data2['Model/name'];
    let $model;
    if (_store.models[name]) {
        $model = _store.models[name];
    } else {
        $model = insert();
        // Model/name
        const $name = _insertPrimitive(ctx, name);
        link($model, $name, 'Model/name');
    }
    _apply({
        changes: {
            models: { [name]: $model },
            records: { [$model]: $model },
        },
    });
    return $model;
}
