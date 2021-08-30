/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        States the OWL component of this message list view
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            component
        [Field/model]
            MessageListView
        [Field/type]
            attr
        [Field/target]
            MessageListComponent
        [Field/inverse]
            MessageListComponent/messageListView
`;
