/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ModelAddon
        [ModelAddon/feature]
            im_livechat
        [ModelAddon/model]
            ThreadNeedactionPreviewComponent
        [ModelAddon/actionAddons]
            ThreadNeedactionPreviewComponent/getImage
`;
