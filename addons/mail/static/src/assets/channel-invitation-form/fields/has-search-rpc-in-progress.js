/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        States whether there is search RPC in progress.
    {Record/insert}
        [Record/traits]
            Field
        [Record/traits]
            Field
        [Field/name]
            hasSearchRpcInProgress
        [Field/model]
            ChannelInvitationForm
        [Field/type]
            attr
        [Field/target]
            Boolean
        [Field/default]
            false
`;