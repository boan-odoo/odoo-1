/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ModelAddon
        [ModelAddon/feature]
            hr_holidays
        [ModelAddon/model]
            ThreadViewComponent
        [ModelAddon/template]
            root
                outOfOffice
`;
