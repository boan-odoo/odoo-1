/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Format the create date to something human readable.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            formattedCreateDatetime
        [Field/model]
            ActivityView
        [Field/type]
            attr
        [Field/target]
            String
        [Field/compute]
            {if}
                @record
                .{ActivityView/activity}
                .{Activity/dateCreate}
                .{isFalsy}
            .{then}
                {Record/empty}
            .{else}
                :momentCreateDate
                    {Record/insert}
                        [Record/traits]
                            Moment
                        {String/autoToDate}
                            @record
                            .{ActivityView/activity}
                            .{Activity/dateCreate}
                :datetimeFormat
                    {Locale/getLangDatetimeFormat}
                @momentCreateDate
                .{Moment/format}
                    @datetimeFormat
`;
