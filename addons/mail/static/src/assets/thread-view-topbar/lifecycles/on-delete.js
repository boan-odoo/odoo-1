/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Lifecycle
        [Lifecycle/name]
            onDelete
        [Lifecycle/model]
            ThreadViewTopbar
        [Lifecycle/behavior]
            {Device/removeEventListener}
                [0]
                    click
                [1]
                    {Record/insert}
                        [Record/traits]
                            Function
                        [Function/in]
                            ev
                        [Function/out]
                            {ThreadViewTopbar/_onClickCaptureGlobal}
                                @record
                                @ev
                [2]
                    true
`;
