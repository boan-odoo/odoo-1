/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            messageView
        [Field/model]
            MessageViewComponent
        [Field/type]
            one
        [Field/target]
            MessageView
        [Field/isRequired]
            true
        [Field/inverse]
            MessageView/component
`;
