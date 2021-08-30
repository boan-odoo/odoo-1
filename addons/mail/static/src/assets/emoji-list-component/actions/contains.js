/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Returns whether the given node is self or a children of self.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            EmojiListComponent/contains
        [Action/params]
            node
            record
        [Action/behavior]
            @record
            .{EmojiListComponent/root}
            .{web.Element/contains}
                @node
`;
