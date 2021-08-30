/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ModelAddon
        [ModelAddon/feature]
            website_slides
        [ModelAddon/model]
            ActivityView
        [ModelAddon/actions]
            ActivityView/onGrantAccess
            ActivityView/onRefuseAccess
`;
