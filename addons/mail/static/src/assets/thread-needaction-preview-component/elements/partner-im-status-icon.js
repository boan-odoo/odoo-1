/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            partnerImStatusIcon
        [Element/model]
            ThreadNeedactionPreviewComponent
        [Field/target]
            PartnerImStatusIconComponent
        [Record/traits]
            NotificationListItemComponent/partnerImStatusIcon
        [Element/isPresent]
            @record
            .{ThreadNeedactionPreviewComponent/threadNeedactionPreviewView}
            .{ThreadNeedactionPreviewView/thread}
            .{Thread/correspondent}
            .{&}
                @record
                .{ThreadNeedactionPreviewComponent/threadNeedactionPreviewView}
                .{ThreadNeedactionPreviewView/thread}
                .{Thread/correspondent}
                .{Partner/imStatus}
        [PartnerImStatusIconComponent/partner]
            @record
            .{ThreadNeedactionPreviewComponent/threadNeedactionPreviewView}
            .{ThreadNeedactionPreviewView/thread}
            .{Thread/correspondent}
`;
