/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            markDoneButton
        [Element/model]
            ActivityComponent
        [Record/traits]
            ActivityComponent/toolButton
        [web.Element/tag]
            button
        [web.Element/class]
            btn
            btn-link
            btn-primary
            pt-0
            pl-0
        [web.Element/isPresent]
            @record
            .{ActivityComponent/activityView}
            .{ActivityView/fileUploader}
            .{isFalsy}
        [web.Element/title]
            @record
            .{ActivityComponent/activityView}
            .{ActivityView/markDoneText}
`;
