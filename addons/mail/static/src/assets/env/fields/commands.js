/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            commands
        [Field/model]
            Env
        [Field/type]
            many
        [Field/target]
            ChannelCommand
`;
