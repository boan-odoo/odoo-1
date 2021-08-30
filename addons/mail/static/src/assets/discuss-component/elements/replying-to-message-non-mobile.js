/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            replyingToMessageComposerNonMobile
        [Element/model]
            DiscussComponent
        [Field/target]
            ComposerViewComponent
        [Record/traits]
            DiscussComponent/replyingToMessageComposer
        [Element/isPresent]
            @record
            .{DiscussComponent/discussView}
            .{DiscussView/discuss}
            .{Discuss/isReplyingToMessage}
        [ComposerViewComponent/composer]
            @record
            .{DiscussComponent/discussView}
            .{DiscussView/discuss}
            .{Discuss/replyingToMessage}
            .{Message/originThread}
            .{Thread/composer}
        [ComposerViewComponent/hasCurrentPartnerAvatar]
            false
        [ComposerViewComponent/hasDiscardButton]
            true
        [ComposerViewComponent/hasThreadName]
            true
        [ComposerViewComponent/isDoFocus]
            @record
            .{DiscussComponent/discussView}
            .{DiscussView/discuss}
            .{Discuss/isDoFocus}
`;
