
/** @odoo-module **/

import { _apply } from '@mail/core/model/_apply';

import { insert } from '@mail/core/node/insert';
import { link } from '@mail/core/node/link';

export function _setupModel() {
    const $model = insert();
    const $rfields = insert();
    link($model, $rfields, 'Record/fields');
    const $mname = insert();
    link($rfields, $mname, 'Model/name');
    const $mfields = insert();
    link($rfields, $mfields, 'Model/fields');
    _apply({
        changes: {
            models: { Model: $model },
            records: { [$model]: $model },
        },
    });
}
