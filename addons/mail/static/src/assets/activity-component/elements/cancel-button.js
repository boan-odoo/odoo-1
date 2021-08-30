/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            cancelButton
        [Element/model]
            ActivityComponent
        [web.Element/tag]
            button
        [Record/traits]
            ActivityComponent/toolButton
        [web.Element/class]
            btn
            btn-link
            btn-primary
            pt-0
        [Element/onClick]
            {ActivityView/onClickCancel}
                [0]
                    @record
                    .{ActivityComponent/activityView}
                [1]
                    @ev
`;
