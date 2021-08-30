/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            ChannelMemberListComponent
        [Model/fields]
            channel
        [Model/template]
            root
                orderedOnlineMembers
                orderedOfflineMembers
                unknownMemberText
                loadMoreMembersContainer
                    loadMoreMembers
`;
