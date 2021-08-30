/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Context
        [Context/name]
            member
        [Context/model]
            ChannelMemberListMemberListComponent
        [Model/fields]
            member
        [Model/template]
            memberForeach
                member
                    avatarContainer
                        avatar
                        partnerImStatusIcon
                    name
`;
