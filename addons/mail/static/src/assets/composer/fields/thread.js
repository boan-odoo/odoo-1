/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        States the thread which this composer represents the state (if any).
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            thread
        [Field/model]
            Composer
        [Field/type]
            one
        [Field/target]
            Thread
        [Field/isReadonly]
            true
        [Field/inverse]
            Thread/composer
`;
