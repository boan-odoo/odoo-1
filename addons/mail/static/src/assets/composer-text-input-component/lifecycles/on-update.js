/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Updates the content and height of a textarea
    {Lifecycle}
        [Lifecycle/name]
            onUpdate
        [Lifecycle/model]
            ComposerTextInputComponent
        [Lifecycle/behavior]
            {if}
                @record
                .{ComposerTextInputComponent/composerView}
                .{isFalsy}
            .{then}
                {break}
            {if}
                @record
                .{ComposerTextInputComponent/composerView}
                .{ComposerView/doFocus}
            .{then}
                {Record/update}
                    [0]
                        @record
                        .{ComposerTextInputComponent/composerView}
                    [1]
                        [ComposerView/doFocus]
                            false
                {if}
                    {Device/isMobile}
                .{then}
                    {web.Element/scrollIntoView}
                        @record
                {web.Element/focus}
                    @record
                    .{ComposerTextInputComponent/textarea}
            {if}
                @record
                .{ComposerTextInputComponent/composerView}
                .{ComposerView/composer}
                .{Composer/isLastStateChangeProgrammatic}
            .{then}
                {Record/update}
                    [0]
                        @record
                        .{ComposerTextInputComponent/textarea}
                    [1]
                        [web.Element/value]
                            @record
                            .{ComposerTextInputComponent/composerView}
                            .{ComposerView/composer}
                            .{Composer/textInputContent}
                {if}
                    @record
                    .{ComposerTextInputComponent/composerView}
                    .{ComposerView/isFocused}
                .{then}
                    {web.Element/setSelectionRange}
                        [0]
                            @record
                            .{ComposerTextInputComponent/_textarea}
                        [1]
                            @record
                            .{ComposerTextInputComponent/composerView}
                            .{ComposerView/composer}
                            .{Composer/textInputCursorStart}
                        [2]
                            @record
                            .{ComposerTextInputComponent/composerView}
                            .{ComposerView/composer}
                            .{Composer/textInputCursorEnd}
                        [3]
                            @record
                            .{ComposerTextInputComponent/composerView}
                            .{ComposerView/composer}
                            .{Composer/textInputSelectionDirection}
                {Record/update}
                    [0]
                        @record
                        .{ComposerTextInputComponent/composerView}
                        .{ComposerView/composer}
                    [1]
                        [Composer/isLastStateChangeProgrammatic]
                            false
            {ComposerTextInputComponent/_updateHeight}
                @record
`;
