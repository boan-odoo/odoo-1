/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            imageContainer
        [Element/model]
            ThreadNeedactionPreviewComponent
        [Record/traits]
            NotificationListItemComponent/imageContainer
`;
