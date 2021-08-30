
/** @odoo-module **/

import { _apply } from '@mail/core/model/_apply';

import { insert } from '@mail/core/node/insert';
import { link } from '@mail/core/node/link';

export function _setupField() {
    const $field = insert();
    const $rfields = insert();
    link($field, $rfields, 'Record/fields');
    const $fname = insert();
    link($rfields, $fname, 'Field/name');
    const $fmodel = insert();
    link($rfields, $fmodel, 'Field/model');
    const $ftype = insert();
    link($rfields, $ftype, 'Field/type');
    const $ftarget = insert();
    link($rfields, $ftarget, 'Field/target');
    const $finverse = insert();
    link($rfields, $finverse, 'Field/inverse');
    const $fisReadonly = insert();
    link($rfields, $fisReadonly, 'Field/isReadonly');
    const $fisRequired = insert();
    link($rfields, $fisRequired, 'Field/isRequired');
    const $fisCausal = insert();
    link($rfields, $fisCausal, 'Field/isCausal');
    const $fcompute = insert();
    link($rfields, $fcompute, 'Field/compute');
    _apply({
        changes: {
            models: { Field: $field },
            records: { [$field]: $field },
        },
    });
}
