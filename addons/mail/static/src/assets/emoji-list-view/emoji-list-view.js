/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            EmojiListView
        [Model/id]
            EmojiListView/popoverViewOwner
        [Model/fields]
            popoverViewOwner
        [Model/actions]
            EmojiListView/onClickEmoji
`;
