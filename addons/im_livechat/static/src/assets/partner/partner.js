/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ModelAddon
        [ModelAddon/feature]
            im_livechat
        [ModelAddon/model]
            Partner
        [ModelAddon/fields]
            livechatUsername
        [ModelAddon/actions]
            Partner/getNextPublicId
        [ModelAddon/actionAddons]
            Partner/convertData
`;
