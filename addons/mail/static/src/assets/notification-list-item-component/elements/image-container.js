/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            imageContainer
        [Element/model]
            NotificationListItemComponent
        [web.Element/style]
            [web.scss/position]
                relative
            [web.scss/width]
                40
                px
            [web.scss/height]
                40
                px
`;
