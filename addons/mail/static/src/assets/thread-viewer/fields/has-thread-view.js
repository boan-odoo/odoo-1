/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Determines whether 'this.thread' should be displayed.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            hasThreadView
        [Field/model]
            ThreadViewer
        [Field/type]
            attr
        [Field/target]
            Boolean
        [Field/default]
            false
`;
