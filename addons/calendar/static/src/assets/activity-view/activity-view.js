/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ModelAddon
        [ModelAddon/feature]
            calendar
        [ModelAddon/model]
            ActivityView
        [ModelAddon/actionAddons]
            ActivityView/onClickCancel
`;
