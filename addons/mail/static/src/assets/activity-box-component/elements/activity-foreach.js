/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            activityViewForeach
        [Element/model]
            ActivityBoxComponent
        [Record/traits]
            Foreach
        [Foreach/collection]
            @record
            .{ActivityBoxComponent/activityBoxView}
            .{ActivityBoxView/activityViews}
        [Foreach/as]
            activityView
        [Element/key]
            @field
            .{Foreach/get}
                activityView
            .{Record/id}
        [Field/target]
            ActivityBoxComponent:activityView
        [ActivityBoxComponent:activityView/activityView]
            @field
            .{Foreach/get}
                activityView
`;
