/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ModelAddon
        [ModelAddon/feature]
            im_livechat
        [ModelAddon/model]
            DiscussSidebarComponent
        [ModelAddon/template]
            root
                categoryLivechat
`;
