/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            AutocompleteInputComponent/doFocus
        [Action/params]
            node
            record
        [Action/behavior]
            {UI/focus}
                @record
                .{AutocompleteInputComponent/root}
`;
