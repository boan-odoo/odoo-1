/** @odoo-module **/

import { _allocateId } from '@mail/core/node/_allocate-id';
import { _apply } from '@mail/core/node/_apply';

/**
 * Insert a (new) node.
 *
 * @returns {NodeId}
 */
export function insert() {
    const node = {
        /**
         * The id of the node.
         */
        id: _allocateId(),
        in: {},
        out: {},
        type: 'node',
    };
    _apply({
        changes: { [node.id]: node },
    });
    return node.id;
}
