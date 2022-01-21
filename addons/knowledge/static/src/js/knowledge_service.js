/** @odoo-module */
import AbstractService from 'web.AbstractService';
import core from 'web.core';

/**
 * This service is used to store data from non-knowledge form views which have a record containing a field which could be used
 * by a knowledge form view
 *
 * Typical usage is the following:
 * - A form view is loaded and one field of the current record matches what can be used in Knowldege.
 *      - Informations about this record and how to access its form view (action) is stored in this service instance
 * - An article is opened in knowledge and it contains a KnowledgeToolbar.
 *      - When the toolbar is created, it asks this service instance if a record can be interacted with
 *      - if there is one such record, the available buttons are displayed in the toolbar
 * - When one of such buttons is used, we reload the form view of the record and execute the desired operation, which is stored
 *   in this service instance with an actionId and a status
 * - During the operation, its status can be updated.
 * - When the operation is completed successfully, the service should be notified and it will be cleared
 *
 * The linkedRecord is cleared or replaced each time a form view (other than a Knowledge article) is accessed
 *
 * status:
 * 'pending' -> waiting to be handled
 * 'handled' -> in the process of being completed, but not completed yet
 * 'failed' -> during the handling process, a problem occurred, and the operation was not completed successfully. It may be unrecoverable.
 * (upon completion, the operation is removed from the service)
 */
const KnowledgeService = AbstractService.extend({
    /**
     * @override
     */
    start() {
        this._super.apply(...arguments);
        this._actions = {};
        this._linkedRecord = null;
    },
    /**
     * @param {Object} record record informations to be stored
     */
    setLinkedRecord(record) {
        this._linkedRecord = record;
    },
    /**
     * @returns {Object} the stored record informations
     */
    getLinkedRecord() {
        return this._linkedRecord;
    },
    /**
     * Adds an action to be executed in the future. Creates a unique id and sets the 'pending' status
     *
     * @param {Object} action
     * @param {string} [action.action] name of the action i.e.: 'use_as_description'
     * @returns {string} the name of the action + the issuing date (to be used as uniqueId)
     */
    addAction(action) {
        const actionId = [action.action, (new Date()).toString()].join('#');
        action.actionId = actionId;
        action._status = 'pending';
        this._actions[actionId] = action;
        return actionId;
    },
    /**
     * @param {string} actionId unique id of an action stored in the service
     * @returns {boolean} whether the service has the action with actionId
     */
    getAction(actionId) {
        return this._actions.hasOwnProperty(actionId) ? this._actions[actionId] : false;
    },
    /**
     * @param {string} actionId unique id of an action stored in the service
     * @returns {boolean} whether the service has the action with actionId
     */
    completeAction(actionId) {
        const hasAction = this._actions.hasOwnProperty(actionId);
        if (hasAction) {
            delete this._actions[actionId];
        }
        return hasAction;
    },
    /**
     * @param {string} actionId unique id of an action stored in the service
     * @returns {boolean} whether the service has the action with actionId
     */
    handleAction(actionId) {
        const hasAction = this._actions.hasOwnProperty(actionId);
        if (hasAction) {
            this._actions[actionId]._status = 'handled';
        }
        return hasAction;
    },
    /**
     * @param {string} actionId unique id of an action stored in the service
     * @returns {boolean} whether the service has the action with actionId
     */
    failAction(actionId) {
        const hasAction = this._actions.hasOwnProperty(actionId);
        if (hasAction) {
            this._actions[actionId]._status = 'failed';
        }
        return hasAction;
    },
});

core.serviceRegistry.add('knowledgeService', KnowledgeService);

export default KnowledgeService;
