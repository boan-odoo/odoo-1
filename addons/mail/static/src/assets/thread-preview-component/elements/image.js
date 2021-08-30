/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            image
        [Element/model]
            ThreadPreviewComponent
        [web.Element/tag]
            img
        [Record/traits]
            NotificationListItemComponent/image
        [web.Element/class]
            rounded-circle
        [web.Element/src]
            {ThreadPreviewComponent/getImage}
                @record
        [web.Element/alt]
            {Locale/text}
                Thread Image
`;
