/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            on leave & away
        [Test/feature]
            hr_holidays
        [Test/model]
            PartnerImStatusIconComponent
        [Test/assertions]
            2
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            @testEnv
            .{Record/insert}
                [Record/traits]
                    Server
                [Server/data]
                    @record
                    .{Test/data}
            :partner
                @testEnv
                .{Record/insert}
                    [Record/traits]
                        Partner
                    [Partner/id]
                        7
                    [Partner/imStatus]
                        leave_away
                    [Partner/name]
                        Demo User
            @testEnv
            .{Record/insert}
                [Record/traits]
                    PartnerImStatusIconComponent
                [PartnerImStatusIconComponent/partner]
                    @partner
            {Test/assert}
                []
                    @partner
                    .{Partner/isImStatusAway}
                []
                    partner IM status icon should have away status rendering
            {Test/assert}
                []
                    @partner
                    .{Partner/partnerImStatusIconComponents}
                    .{Collection/first}
                    .{PartnerImStatusIconComponent/icon}
                    .{web.Element/class}
                    .{String/includes}
                        fa-plane
                []
                    partner IM status icon should have leave status rendering
`;
