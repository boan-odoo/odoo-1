/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            buttonSend
        [Element/model]
            ComposerViewComponent
        [web.Element/tag]
            button
        [web.Element/type]
            button
        [Record/traits]
            ComposerViewComponent/actionButton
            ComposerViewComponent/button
        [web.Element/class]
            btn
            btn-primary
        [Element/isPresent]
            @record
            .{ComposerViewComponent/hasSendButton}
        [web.Element/isDisabled]
            @record
            .{ComposerViewComponent/composerView}
            .{ComposerView/composer}
            .{Composer/canPostMessage}
            .{isFalsy}
        [Element/onClick]
            {ComposerViewComponent/_postMessage}
                @record
            {Record/update}
                [0]
                    @record
                    .{ComposerViewComponent/composerView}
                [1]
                    [ComposerView/doFocus]
                        true
        [web.Element/textContent]
            {if}
                {Device/isMobile}
                .{isFalsy}
            .{then}
                @record
                .{ComposerViewComponent/composerView}
                .{ComposerView/sendButtonText}
        [web.Element/style]
            {if}
                @record
                .{ComposerViewComponent/isCompact}
                .{&}
                    @record
                    .{ComposerViewComponent/hasCurrentPartnerAvatar}
                .{&}
                    {Device/isMobile}
                    .{|}
                        @record
                        .{ComposerViewComponent/hasDiscardButton}
                        .{isFalsy}
            .{then}
                [web.scss/border-radius]
                    0
                    {scss/$o-mail-rounded-rectangle-border-radius-lg}
                    {scss/$o-mail-rounded-rectangle-border-radius-lg}
                    0
`;
