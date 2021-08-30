/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Action to initiate reply to current messageView.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            MessageView/replyTo
        [Action/params]
            record
                [type]
                    MessageView
        [Action/behavior]
            {Dev/comment}
                When already replying to this messageView, discard the reply.
            {if}
                @record
                .{MessageView/threadView}
                .{ThreadView/replyingToMessageView}
                .{=}
                    @record
            .{then}
                {ComposerView/discard}
                    @record
                    .{MessageView/threadView}
                    .{ThreadView/composerView}
                {break}
            {Record/update}
                [0]
                    @record
                    .{MessageView/message}
                    .{Message/originThread}
                [1]
                    [Thread/composer]
                        {Record/insert}
                            [Record/traits]
                                Composer
                            [Composer/isLog]
                                @record
                                .{MessageView/message}
                                .{Message/isDiscussion}
                                .{isFalsy}
                                .{&}
                                    @record
                                    .{MessageView/message}
                                    .{Message/isNotification}
                                    .{isFalsy}
            {Record/update}
                [0]
                    @record
                    .{MessageView/threadView}
                [1]
                    [ThreadView/replyingToMessageView}
                        @record
                    [ThreadView/composerView]
                        {Record/insert}
                            [Record/traits]
                                ComposerView
                            [ComposerView/doFocus]
                                true
`;
