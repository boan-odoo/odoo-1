/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ModelAddon
        [ModelAddon/feature]
            hr_holidays
        [ModelAddon/model]
            Partner
        [ModelAddon/fields]
            outOfOfficeDateEnd
            outOfOfficeText
        [ModelAddon/fieldAddons]
            isImStatusAway
            isImStatusOffline
            isImStatusOnline
            isOnline
        [ModelAddon/actionAddons]
            Partner/convertData
`;
