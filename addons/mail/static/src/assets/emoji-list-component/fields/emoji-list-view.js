/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            emojiListView
        [Field/model]
            EmojiListComponent
        [Field/type]
            one
        [Field/target]
            EmojiListView
        [Field/isRequired]
            true
`;
