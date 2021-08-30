/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ModelAddon
        [ModelAddon/feature]
            im_livechat
        [ModelAddon/model]
            Thread
        [ModelAddon/fields]
            messagingAsPinnedLivechat
        [ModelAddon/fieldAddons]
            correspondent
            displayName
            hasInviteFeature
            hasMemberListFeature
            isChatChannel
        [ModelAddon/actionAddons]
            Thread/_getDiscussSidebarCategory
            Thread/convertData
            Thread/getMemberName
`;
