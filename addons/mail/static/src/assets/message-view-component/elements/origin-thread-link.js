/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            originThreadLink
        [Element/model]
            MessageViewComponent
        [web.Element/tag]
            a
        [web.Element/href]
            @record
            .{MessageViewComponent/messageView}
            .{MessageView/message}
            .{Message/originThread}
            .{Thread/url}
        [Element/onClick]
            {Dev/comment}
                avoid following dummy href
            {web.Event/preventDefault}
                @ev
            {Thread/open}
                @record
                .{MessageViewComponent/messageView}
                .{MessageView/message}
                .{Message/originThread}
        [web.Element/textContent]
            {if}
                @record
                .{MessageViewComponent/messageView}
                .{MessageView/message}
                .{Message/originThread}
                .{Thread/model}
                .{=}
                    mail.channel
            .{then}
                {if}
                    @record
                    .{MessageViewComponent/messageView}
                    .{MessageView/message}
                    .{Message/originThread}
                    .{Thread/displayName}
                .{then}
                    #
                    .{+}
                        @record
                        .{MessageViewComponent/messageView}
                        .{MessageView/message}
                        .{Message/originThread}
                        .{Thread/displayName}
                .{else}
                    {Locale/text}
                        channel)
            .{else}
                {if}
                    @record
                    .{MessageViewComponent/messageView}
                    .{MessageView/message}
                    .{Message/originThread}
                    .{Thread/displayName}
                .{then}
                    #
                    .{+}
                        @record
                        .{MessageViewComponent/messageView}
                        .{MessageView/message}
                        .{Message/originThread}
                        .{Thread/displayName}
                .{else}
                    {Locale/text}
                        document
        [web.Element/style]
            [web.scss/font-size]
                1.25em
                {Dev/comment}
                    original size
`;
