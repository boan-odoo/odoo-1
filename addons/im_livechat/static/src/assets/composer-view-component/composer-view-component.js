/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ModelAddon
        [ModelAddon/feature]
            hr_holidays
        [ModelAddon/model]
            ComposerViewComponent
        [ModelAddon/elementAddons]
            buttonAttachment
`;
