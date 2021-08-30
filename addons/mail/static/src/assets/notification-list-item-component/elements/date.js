/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            date
        [Element/model]
            NotificationListItemComponent
        [Record/traits]
            NotificationListItemComponent/bold
        [web.Element/style]
            [web.scss/flex]
                0
                0
                auto
            [web.scss/font-size]
                x-small
            [web.scss/color]
                {scss/gray}
                    500
`;
