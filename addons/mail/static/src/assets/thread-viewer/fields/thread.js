/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Determines the 'Thread' that should be displayed by 'this'.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            thread
        [Field/model]
            ThreadViewer
        [Field/type]
            one
        [Field/target]
            Thread
`;
