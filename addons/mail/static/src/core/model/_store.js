/** @odoo-module **/

export const _store = {
    /**
     * All models.
     * Key is model name, value is node id of model.
     */
    models: {},
    /**
     * Get primitive value from node.
     * Key is node id, value is primitive value.
     */
    nodeToPrimitive: {},
    /**
     * All primitives in use.
     * Key is primitive value, value is node id of primitive.
     */
    primitives: {},
    /**
     * All records.
     * Key is record id, value is node id of record.
     */
    records: {},
};
window['model/store'] = _store;
