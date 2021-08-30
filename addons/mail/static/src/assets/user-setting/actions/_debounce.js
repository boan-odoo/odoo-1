/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            UserSetting/_debounce
        [Action/params]
            f
                [type]
                    Function
            delay
                [type]
                    Integer
                [description]
                    delay in ms
            key
                [type]
                    String
            record
                [type]
                    UserSetting
        [Action/behavior]
            {if}
                @record
                .{UserSetting/_timeoutIds}
                .{Dict/get}
                    @key
            .{then}
                {Browser/clearTimeout}
                    @record
                    .{UserSetting/_timeoutIds}
                    .{Dict/get}
                        @key
            {Record/update}
                [0]
                    @record
                    .{UserSetting/_timeoutIds}
                [1]
                    [@key]
                        {Browser/setTimeout}
                            [0]
                                {if}
                                    {Record/exists}
                                        @record
                                    .{isFalsy}
                                .{then}
                                    {break}
                                @f
                                .{Function/call}
                            [1]
                                @delay

`;
