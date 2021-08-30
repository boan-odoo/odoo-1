/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Display name of the visitor.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            displayName
        [Field/model]
            Visitor
        [Field/type]
            attr
        [Field/target]
            String
`;
