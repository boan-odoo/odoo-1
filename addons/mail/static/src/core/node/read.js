/** @odoo-module **/

import { _store } from '@mail/core/node/_store';

/**
 *
 * @param {NodeId} $node
 * @param {string} [name]
 * @returns {NodeId}
 */
export function read($node, name) {
    const node = _store.nodes[$node];
    return _store.nodes[node.out[name]].out;
}
