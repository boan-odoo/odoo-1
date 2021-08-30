/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            NotificationAlertComponent
        [Model/template]
            root
                text
        [Model/actions]
            NotificationAlertComponent/isNotificationBlocked
`;
