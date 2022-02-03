/** @odoo-module **/

import { registry } from '@web/core/registry';

const mailModelDefinitionsRegistry = registry.category('mailModelDefinitions');
mailModelDefinitionsRegistry.category('modelNamesToFetch').add('website.visitor');

const customModelFieldsRegistry = mailModelDefinitionsRegistry.category('customModelFields');
customModelFieldsRegistry.category('mail.channel').add('history', { string: 'History', type: 'string' });
customModelFieldsRegistry.category('website.visitor').add('history', { string: "History", type: 'string'});
customModelFieldsRegistry.category('website.visitor').add('lang_name', { string: "Language name", type: 'string'});
customModelFieldsRegistry.category('website.visitor').add('website_name', { string: "Website name", type: 'string' });
