
/** @odoo-module **/

import { _apply } from '@mail/core/model/_apply';
import { _insertPrimitive } from '@mail/core/model/_insert-primitive';
import { _store } from '@mail/core/model/_store';

import { insert } from '@mail/core/node/insert';
import { link } from '@mail/core/node/link';

export function _insertAction(ctx, data) {
    const data2 = { ...data };
    const name = data2['Action/name'];
    delete data2['Action/name'];
    let $action;
    if (_store.models[name]) {
        $action = _store.models[name];
    } else {
        $action = insert();
    }
    const func = data2['Action/func'];
    delete data2['Action/func'];
    const $func = _insertPrimitive(ctx, func);
    link($action, $func, 'Action/behavior');
    // TODO: handle other kinds of data

    _apply({
        changes: {
            models: { [name]: $action },
            records: { [$action]: $action },
        },
    });
    return $action;
}
