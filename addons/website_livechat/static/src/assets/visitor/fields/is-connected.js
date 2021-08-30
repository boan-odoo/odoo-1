/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Determine whether the visitor is connected or not.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            isConnected
        [Field/model]
            Visitor
        [Field/type]
            attr
        [Field/target]
            Boolean
`;
