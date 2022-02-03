/** @odoo-module **/

import { registry } from '@web/core/registry';

const mailModelDefinitionsRegistry = registry.category('mailModelDefinitions');
mailModelDefinitionsRegistry.category('modelNamesToFetch').add('im_livechat.channel');
mailModelDefinitionsRegistry.category('customModelFields').category('mail.channel').add('anonymous_name', { type: 'char' });
