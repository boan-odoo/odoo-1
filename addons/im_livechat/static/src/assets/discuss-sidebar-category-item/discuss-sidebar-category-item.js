/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ModelAddon
        [ModelAddon/feature]
            im_livechat
        [ModelAddon/model]
            DiscussSidebarCategoryItem
        [ModelAddon/fieldAddons]
            avatarUrl
            categoryCounterContribution
            counter
            hasUnpinCommand
            hasThreadIcon
`;
