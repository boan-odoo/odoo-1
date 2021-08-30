/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            snailmailErrorView
        [Field/model]
            SnailmailErrorComponent
        [Field/type]
            one
        [Field/target]
            SnailmailErrorView
        [Field/isRequired]
            true
        [Field/inverse]
            SnailmailErrorView/component
`;
