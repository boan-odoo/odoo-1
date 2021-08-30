/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            MessageListView
        [Model/fields]
            clientHeight
            component
            isAtEnd
            isLastScrollProgrammatic
            scrollHeight
            scrollTop
            threadViewOwner
        [Model/id]
            MessageListView/threadViewOwner
`;
