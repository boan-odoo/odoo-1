
/** @odoo-module **/

import { _store } from '@mail/core/model/_store';

import { insert } from '@mail/core/node/insert';
import { link } from '@mail/core/node/link';
import { read } from '@mail/core/node/read';

export function _insertRecord(ctx, data) {
    const $record = insert();
    const $traits = insert();
    link($record, $traits, 'Record/traits');
    const $fields = insert();
    link($record, $fields, 'Record/fields');
    const data2 = { ...data };
    if ('Record/traits' in data2) {
        let traits;
        if (typeof data2['Record/traits'] === 'string') {
            // single trait
            traits = [data2['Record/traits']];
        } else {
            // multi-traits
            traits = data2['Record/traits'];
        }
        for (const trait of traits) {
            if (!_store.models[trait]) {
                throw new Error(`Failed to insert record with non-existing trait "${trait}".`);
            }
            const $trait = _store.models[trait];
            link($traits, $trait, trait);
        }
        // TODO make links from this record to model fields in traits, prepare 'Record/fields'.
    }
    delete data2['Record/traits'];
    for (const $data in data2) {
        if (!($data in read($fields, 'refs'))) {
            // throw new Error(`Failed to insert record with data "${$data}" not being a field in its traits`);
        }
        // TODO insert field in record
    }
    return $;
}
