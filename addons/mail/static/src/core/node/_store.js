/** @odoo-module **/

/**
 * The store node that contains all the data related to nodes.
 */
export const _store = {
    /**
     * The next id to allocate for new node to create.
     * @see `_allocate-id`
     */
    nextId: 1,
    /**
     * All the nodes in the store.
     * Keys are ids of node and value is data of corresponding node.
     */
    nodes: {},
};
window['node/store'] = _store;
