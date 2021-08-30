
/** @odoo-module **/

import { _apply } from '@mail/core/model/_apply';
import { _insertModel } from '@mail/core/model/_insert-model';
import { _insertPrimitive } from '@mail/core/model/_insert-primitive';
import { _store } from '@mail/core/model/_store';

import { insert } from '@mail/core/node/insert';
import { link } from '@mail/core/node/link';

export function _insertField(ctx, data) {
    const data2 = { ...data };

    const fname = data2['Field/name'];
    const model = data2['Field/model'];
    delete data2['Model/name'];
    delete data2['Field/model'];
    const mname = `${model}/${fname}`;
    let $field;
    if (_store.models[mname]) {
        $field = _store.models[mname];
    } else {
        $field = insert();
    }

    // 1. Field/name
    const $fname = _insertPrimitive(ctx, fname);
    link($field, $fname, 'Field/name');

    // 2. Field/model
    const $model = _insertModel(ctx, { 'Model/name': model });
    link($field, $model, 'Field/model');

    // 3. Field/type
    const type = data2['Field/type'];
    const $type = _insertPrimitive(ctx, type);
    link($field, $type, 'Field/type');
    delete data2['Field/type'];

    // 4. Field/target
    // assumes model is already in model store
    // only handled for relational field
    if (['one', 'many'].includes(type)) {
        const target = data2['Field/target'];
        const $target = _insertModel(ctx, { 'Model/name': target });
        link($field, $target, 'Field/target');
        delete data2['Field/target'];
    }

    // TODO: handle other kinds of data

    _apply({
        changes: {
            models: { [mname]: $field },
            records: { [$field]: $field },
        },
    });
    return $field;
}
