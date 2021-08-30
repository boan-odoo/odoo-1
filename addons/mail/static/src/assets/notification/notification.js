/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            Notification
        [Model/fields]
            failureType
            iconClass
            iconTitle
            id
            isFailure
            isFromCurrentUser
            group
            message
            partner
            status
            type
        [Model/id]
            Notification/id
        [Model/actions]
            Notification/convertData
`;
