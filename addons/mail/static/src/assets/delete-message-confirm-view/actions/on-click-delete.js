/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            DeleteMessageConfirmView/onClickDelete
        [Action/params]
            record
                [type]
                    DeleteMessageConfirmView
        [Action/behavior]
            {Message/updateContent}
                [0]
                    @record
                    .{DeleteMessageConfirmView/message}
                [1]
                    [attachment_ids]
                        {Record/insert}
                            [Record/traits]
                                Collection
                    [body]
                        {String/empty}
`;
