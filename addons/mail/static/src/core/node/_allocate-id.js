/** @odoo-module **/

import { _store } from '@mail/core/node/_store';

/**
 * Allocate a new id for the node that is being created.
 *
 * @returns {Integer}
 */
export function _allocateId() {
    const id = _store.nextId;
    _store.nextId++;
    return id;
}
