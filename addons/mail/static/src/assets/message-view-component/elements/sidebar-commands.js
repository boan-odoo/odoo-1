/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            sidebarCommands
        [Element/model]
            MessageViewComponent
        [web.Element/style]
            [web.scss/display]
                none
`;
