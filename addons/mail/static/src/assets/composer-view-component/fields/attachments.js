/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            attachments
        [Field/model]
            ComposerViewComponent
        [Field/type]
            one
        [Field/target]
            Attachment
        [Field/isRequired]
            true
`;
