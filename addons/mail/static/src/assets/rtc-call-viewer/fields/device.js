/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            device
        [Field/model]
            RtcCallViewer
        [Field/type]
            one
        [Field/target]
            Device
        [Field/default]
            {Env/device}
        [Field/observe]
            {Record/insert}
                [Record/traits]
                    FieldObserver
                [FieldObserver/event]
                    fullscreenchange
                [FieldObserver/callback]
                    {RtcCallViewer/onFullscreenchange}
                        @record
                        @ev
`;
