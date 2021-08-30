/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            activity
        [Field/model]
            MailTemplateComponent
        [Field/type]
            one
        [Field/target]
            Activity
        [Field/isRequired]
            true
`;
