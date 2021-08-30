/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Mailbox History.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            history
        [Field/model]
            Env
        [Field/type]
            one
        [Field/target]
            Thread
`;
