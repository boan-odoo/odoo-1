/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            fileUploader
        [Field/model]
            ActivityView
        [Field/type]
            one
        [Field/target]
            FileUploader
        [Field/isCausal]
            true
        [Field/inverse]
            FileUploader/activityView
        [Field/compute]
            {if}
                @record
                .{ActivityView/activity}
                .{Activity/category}
                .{=}
                    upload_file
            .{then}
                {Record/insert}
                    [Record/traits]
                        FileUploader
            .{else}
                {Record/empty}
`;
