/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            NotificationGroupComponent
        [Model/fields]
            notificationGroupView
        [Model/template]
            root
                sidebar
                    imageContainer
                        image
                content
                    header
                        name
                        counter
                        headerAutogrowSeparator
                        date
                    core
                        inlineText
                        coreAutogrowSeparator
                        markAsRead
`;
