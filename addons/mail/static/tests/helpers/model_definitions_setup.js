/** @odoo-module **/

import { TEST_USER_IDS } from '@mail/utils/test_utils';
import { registry } from '@web/core/registry';
import { patch } from 'web.utils';

const modelDefinitionsRegistry = registry.category('mailModelDefinitions');
const modelNamesToFetchRegistry = modelDefinitionsRegistry.category('modelNamesToFetch');
const defaultFieldsValuesRegistry = modelDefinitionsRegistry.category('defaultFieldsValues');
const customModelFieldsRegistry = modelDefinitionsRegistry.category('customModelFields');

//--------------------------------------------------------------------------
// Model names to fetch
//--------------------------------------------------------------------------

const modelNamesToFetch = [
    'ir.attachment', 'ir.model', 'mail.activity', 'mail.activity.type',
    'mail.channel', 'mail.followers', 'mail.message', 'mail.message.subtype',
    'mail.notification', 'mail.shortcode', 'mail.template', 'mail.tracking.value',
    'res.company', 'res.country', 'res.partner', 'res.users', 'res.users.settings'
];

for (const modelName of modelNamesToFetch) {
    modelNamesToFetchRegistry.add(modelName);
}

//--------------------------------------------------------------------------
// Default field values
//--------------------------------------------------------------------------

defaultFieldsValuesRegistry.category('mail.activity').add('chaining_type', 'suggest');
defaultFieldsValuesRegistry.category('mail.channel').add('is_pinned', true);
defaultFieldsValuesRegistry.category('mail.channel').add('members', function () { return [this.currentPartnerId]; });
defaultFieldsValuesRegistry.category('mail.channel').add('state', 'open');
defaultFieldsValuesRegistry.category('mail.channel').add('uuid', () => _.uniqueId('mail.channel_uuid-'));
defaultFieldsValuesRegistry.category('mail.message').add('author_id', function () { return this.currentPartnerId; });

//--------------------------------------------------------------------------
// Custom model fields
//--------------------------------------------------------------------------

const mailChannelCustomFieldsRegistry = customModelFieldsRegistry.category('mail.channel');
mailChannelCustomFieldsRegistry.add('avatarCacheKey', { string: "Avatar Cache Key", type: "datetime" });
mailChannelCustomFieldsRegistry.add('custom_channel_name', { string: "Custom channel name", type: 'char' });
mailChannelCustomFieldsRegistry.add('fetched_message_id', { relation: 'mail.message', string: "Last Fetched", type: 'many2one' });
mailChannelCustomFieldsRegistry.add('group_based_subscription', { string: "Group based subscription", type: "boolean" });
mailChannelCustomFieldsRegistry.add('is_minimized', { string: "isMinimized", type: "boolean" });
mailChannelCustomFieldsRegistry.add('is_pinned', { string: "isPinned", type: "boolean" });
mailChannelCustomFieldsRegistry.add('last_interest_dt', { string: "Last Interest", type: "datetime" });
mailChannelCustomFieldsRegistry.add('members', { relation: 'res.partner', string: "Members", type: 'many2many' });
mailChannelCustomFieldsRegistry.add('seen_message_id', { relation: 'mail.message', string: "Last Seen", type: 'many2one' });
mailChannelCustomFieldsRegistry.add('state', { string: "FoldState", type: "char" });

const mailFollowersCustomFieldsRegistry = customModelFieldsRegistry.category('mail.followers');
mailFollowersCustomFieldsRegistry.add('is_editable', { type: 'boolean' });
mailFollowersCustomFieldsRegistry.add('partner_id', { type: 'integer' });

const mailMessageCustomFieldsRegistry = customModelFieldsRegistry.category('mail.message');
mailMessageCustomFieldsRegistry.add('history_partner_ids', { relation: 'res.partner', string: "Partners with History", type: 'many2many' });
mailMessageCustomFieldsRegistry.add('is_discussion', { string: "Discussion", type: 'boolean' });
mailMessageCustomFieldsRegistry.add('is_note', { string: "Note", type: 'boolean' });
mailMessageCustomFieldsRegistry.add('is_notification', { string: "Notification", type: 'boolean' });
mailMessageCustomFieldsRegistry.add('needaction_partner_ids', { relation: 'res.partner', string: "Partners with Need Action", type: 'many2many' });
mailMessageCustomFieldsRegistry.add('res_model_name', { string: "Res Model Name", type: 'char' });

const mailTrackingValueCustomFieldsRegistry = customModelFieldsRegistry.category('mail.tracking.value');
mailTrackingValueCustomFieldsRegistry.add('changed_field', { string: 'Changed field', type: 'char' });
mailTrackingValueCustomFieldsRegistry.add('new_value', { string: 'New value', type: 'char' });
mailTrackingValueCustomFieldsRegistry.add('old_value', { string: 'Old value', type: 'char' });

customModelFieldsRegistry.category('mail.message.subtype').add('subtype_xmlid', { type: 'char' });
customModelFieldsRegistry.category('res.partner').add('description', { string: 'description', type: 'text' });

//--------------------------------------------------------------------------
// Initial records
//--------------------------------------------------------------------------

const initialRecordsRegistry = modelDefinitionsRegistry.category('initialRecords');
// Modify the initialRecordsRegistry add method in order to make it concatenate
// the records instead of overwriting them.
patch(initialRecordsRegistry, 'mail/model_definitions_setup', {
    add(key, value) {
        let currentValue = [];
        if (this.contains(key)) {
            currentValue = this.get(key);
        }
        if (!Array.isArray(value)) {
            value = [value];
        }
        this._super(key, currentValue.concat(value), { force: true });
    }
});
initialRecordsRegistry.add('mail.activity.type', [
    { icon: 'fa-envelope', id: 1, name: "Email" },
    { icon: 'fa-upload', id: 28, name: "Upload Document" },
]);
initialRecordsRegistry.add('mail.message.subtype', [
    { name: "Discussions", sequence: 0, subtype_xmlid: 'mail.mt_comment' },
    { default: false, internal: true, name: "Note", sequence: 100, subtype_xmlid: 'mail.mt_note' },
    { default: false, internal: true, name: "Activities", sequence: 90, subtype_xmlid: 'mail.mt_activities' },
]);
initialRecordsRegistry.add('res.company', [{ id: 1 }]);
initialRecordsRegistry.add('res.users', [
    { display_name: "Your Company, Mitchell Admin", id: TEST_USER_IDS.currentUserId, name: "Mitchell Admin", partner_id: TEST_USER_IDS.currentPartnerId, },
    { active: false, display_name: "Public user", id: TEST_USER_IDS.publicUserId, name: "Public user", partner_id: TEST_USER_IDS.publicPartnerId, },
]);
initialRecordsRegistry.add('res.partner', [
    { active: false, display_name: "Public user", id: TEST_USER_IDS.publicPartnerId, },
    { display_name: "Your Company, Mitchell Admin", id: TEST_USER_IDS.currentPartnerId, name: "Mitchell Admin", },
    { active: false, display_name: "OdooBot", id: TEST_USER_IDS.partnerRootId, },
]);
