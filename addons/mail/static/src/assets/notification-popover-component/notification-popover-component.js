/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            NotificationPopoverComponent
        [Model/fields]
            messageView
        [Model/template]
            root
                notificationForeach
`;
