/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            partnerImStatusIcon
        [Element/model]
            NotificationRequestComponent
        [Field/target]
            PartnerImStatusIconComponent
        [Record/traits]
            NotificationListItemComponent/partnerImStatusIcon
        [PartnerImStatusIconComponent/partner]
            {Env/partnerRoot}
`;
