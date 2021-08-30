/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            DiscussSidebarCategoryItemComponent
        [Model/fields]
            categoryItem
        [Model/template]
            root
                avatar
                    imageContainer
                        image
                        threadIcon
                name
                autogrow
                commands
                    commandSettings
                    commandLeave
                    commandUnpin
                callIndicator
                counter
`;
