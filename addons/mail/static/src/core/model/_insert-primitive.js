
/** @odoo-module **/

import { _apply } from '@mail/core/model/_apply';
import { _insertRecord } from '@mail/core/model/_insert-record';
import { _store } from '@mail/core/model/_store';

import { insert } from '@mail/core/node/insert';
import { link } from '@mail/core/node/link';

/**
 * Insert the primitive with provided data
 *
 * @param {Context} ctx 
 * @param {Object} data 
 * @returns {NodeId}
 */
export function _insertPrimitive(ctx, data) {
    // TODO make a primitive record
    return insert();
}
