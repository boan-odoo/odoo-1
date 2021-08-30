/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            replyingToMessageComposerMobile
        [Element/model]
            DiscussComponent
        [Field/target]
            ComposerViewComponent
        [Record/traits]
            DiscussComponent/replyingToMessageComposer
        [Element/isPresent]
            {Device/isMobile}
            .{&}
                {Discuss/replyingToMessageComposerView}
        [web.Element/class]
            w-100
        [ComposerViewComponent/composerView]
            {Discuss/composerView}
        [ComposerViewComponent/hasCurrentPartnerAvatar]
            {Device/isMobile}
            .{isFalsy}
        [ComposerViewComponent/hasDiscardButton]
            true
        [ComposerViewComponent/hasThreadName]
            true
`;
