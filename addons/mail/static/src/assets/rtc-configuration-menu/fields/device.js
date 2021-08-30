/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            device
        [Field/model]
            RtcConfigurationMenu
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
                    keydown
                [FieldObserver/callback]
                    {RtcConfigurationMenu/_onKeydown}
                        @record
                        @ev
            {Record/insert}
                [Record/traits]
                    FieldObserver
                [FieldObserver/event]
                    keydown
                [FieldObserver/callback]
                    {RtcConfigurationMenu/_onKeyup}
                        @record
                        @ev
`;
