/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            root
        [Element/model]
            ThreadPreviewComponent
        [Record/traits]
            Hoverable
            NotificationListItemComponent/root
        [Element/onClick]
            {if}
                @record
                .{ThreadPreviewComponent/markAsRead}
                .{&}
                    @record
                    .{ThreadPreviewComponent/markAsRead}
                    .{web.Element/contains}
                        @ev
                        .{web.Event/target}
            .{then}
                {Dev/comment}
                    handled in _onClickMarkAsRead
                {break}
            {Thread/open}
                @record
                .{ThreadPreviewComponent/threadPreviewView}
                .{ThreadPreviewView/thread}
            {if}
                {Device/isMobile}
                .{isFalsy}
            .{then}
                {MessagingMenu/close}
        [web.Element/data-thread-local-id]
            @record
            .{ThreadPreviewComponent/threadPreviewView}
            .{ThreadPreviewView/thread}
            .{Record/id}
        [web.Element/style]
            {if}
                @field
                .{web.Element/isHover}
            .{then}
                {web.scss/selector}
                    [0]
                        .o-ThreadPreviewComponent-markAsRead
                    [1]
                        [web.scss/opacity]
                            1
                {web.scss/selector}
                    [0]
                        .o-ThreadPreviewComponent-partnerImStatusIcon
                    [1]
                        {web.scss/include}
                            {scss/o-mail-notification-list-item-hover-partner-im-status-icon-style}
            {if}
                @record
                .{ThreadPreviewComponent/threadPreviewView}
                .{ThreadPreviewView/thread}
                .{Thread/localMessageUnreadCounter}
                .{=}
                    0
                .{&}
                    @field
                    .{web.Element/isHover}
            .{then}
                {web.scss/selector}
                    [0]
                        .o-ThreadPreviewComponent-partnerImStatusIcon
                    [1]
                        {web.scss/include}
                            {scss/o-mail-notification-list-item-muted-hover-partner-im-status-icon-style}
            {if}
                @record
                .{ThreadPreviewComponent/threadPreviewView}
                .{ThreadPreviewView/thread}
                .{Thread/localMessageUnreadCounter}
                .{=}
                    0
            .{then}
                [web.scss/background-color]
                    {scss/$o-mail-notification-list-item-muted-background-color}
                {if}
                    @field
                    .{web.Element/isHover}
                .{then}
                    [web.scss/background-color]
                        {scss/$o-mail-notification-list-item-muted-hover-background-color}
`;
