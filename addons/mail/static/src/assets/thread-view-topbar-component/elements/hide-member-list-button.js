/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            hideMemberListButton
        [Element/model]
            ThreadViewTopbarComponent
        [Record/traits]
            ThreadViewTopbarComponent/button
        [Element/isPresent]
            @record
            .{ThreadViewTopbarComponent/threadViewTopbar}
            .{ThreadViewTopbar/thread}
            .{Thread/hasMemberListFeature}
            .{&}
                @record
                .{ThreadViewTopbarComponent/threadViewTopbar}
                .{ThreadViewTopbar/threadView}
                .{ThreadView/hasMemberList}
            .{&}
                @record
                .{ThreadViewTopbarComponent/threadViewTopbar}
                .{ThreadViewTopbar/threadView}
                .{ThreadView/isMemberListOpened}
                .{isFalsy}
        [web.Element/title]
            {Locale/text}
                Hide Member List
        [Element/onClick]
            {ThreadViewTopbar/onClickHideMemberList}
                @record
                .{ThreadViewTopbarComponent/threadViewTopbar}
`;
