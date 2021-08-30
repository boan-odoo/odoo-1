/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            isFailure
        [Field/model]
            Notification
        [Field/type]
            attr
        [Field/target]
            Boolean
        [Field/compute]
            {Record/insert}
                [Record/traits]
                    Collection
                exception
                bounce
            .{Collection/includes}
                @record
                .{Notification/status}
`;
