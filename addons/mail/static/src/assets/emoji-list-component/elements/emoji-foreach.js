/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            emojiForeach
        [Element/model]
            EmojiListComponent
        [Record/traits]
            Foreach
        [Field/target]
            EmojiListComponent:emoji
        [Foreach/collection]
            @record
            .{EmojiListComponent/emojis}
        [EmojiListComponent:emoji/emoji]
            @field
            .{Foreach/get}
                emoji
        [Foreach/as]
            emoji
        [Element/key]
            @field
            .{Foreach/get}
                emoji
            .{Emoji/unicode}
`;
