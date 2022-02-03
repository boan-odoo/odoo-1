/** @odoo-module **/

import { registry } from '@web/core/registry';

registry.category('mailModelDefinitions').category('customModelFields')
    .category('res.partner').add('out_of_office_date_end', { type: 'date' });
