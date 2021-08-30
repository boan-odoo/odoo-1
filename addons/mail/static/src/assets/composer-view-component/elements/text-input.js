/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            textInput
        [Element/model]
            ComposerViewComponent
        [Field/target]
            ComposerTextInputComponent
        [ComposerTextInputComponent/composerView]
            @record
            .{ComposerViewComponent/composerView}
        [ComposerTextInputComponent/hasMentionSuggestionsBelowPosition]
            @record
            .{ComposerViewComponent/hasMentionSuggestionsBelowPosition}
        [ComposerTextInputComponent/isCompact]
            @record
            .{ComposerViewComponent/isCompact}
        [Element/onPaste]
            {if}
                @ev
                .{web.PasteEvent/clipboardData}
                .{isFalsy}
                .{|}
                    @ev
                    .{web.PasteEvent/clipboardData}
                    .{web.ClipboardData/files}
                    .{isFalsy}
            .{then}
                {break}
            {FileUploader/uploadFiles}
                [0]
                    @record
                    .{ComposerViewComponent/composerView}
                    .{ComposerView/fileUploader}
                [1]
                    @ev
                    .{web.PasteEvent/clipboardData}
                    .{web.ClipboardData/files}
        [Element/t-key]
            @record
            .{ComposerViewComponent/composerView}
            .{Record/id}
        [web.Element/style]
            [web.scss/flex]
                1
                1
                auto
            [web.scss/align-self]
                stretch
            {if}
                @record
                .{ComposerViewComponent/isCompact}
                .{isFalsy}
            .{then}
                [web.scss/border]
                    0
                [web.scss/min-height]
                    40
                    px
                [web.scss/border-radius]
                    {scss/$o-mail-rounded-rectangle-border-radius-lg}
            [web.scss/appearance]
                none
            [web.scss/outline]
                none
            [web.scss/background-color]
                {scss/$white}
            [web.scss/border]
                {scss/$border-width}
                solid
                {scss/$border-color}
            [web.scss/border-right]
                0
            {if}
                @record
                .{ComposerViewComponent/isCompact}
                .{&}
                    @record
                    .{ComposerViewComponent/hasCurrentPartnerAvatar}
            .{then}
                [web.scss/border-radius]
                    {scss/$o-mail-rounded-rectangle-border-radius-lg}
                    0
                    0
                    {scss/$o-mail-rounded-rectangle-border-radius-lg}
`;
