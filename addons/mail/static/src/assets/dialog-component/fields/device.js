/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            device
        [Field/model]
            DialogComponent
        [Field/type]
            one
        [Field/target]
            Device
        [Field/default]
            {Env/device}
        [Field/observe]
            {Record/insert}
                [Record/traits]
                    Collection
                [0]
                    {Record/insert}
                        [Record/traits]
                            FieldObserver
                        [FieldObserver/event]
                            click
                        {Dev/comment}
                            Closes the dialog when clicking outside.
                            Does not work with attachment viewer
                            because it takes the whole space.
                        [FieldObserver/callback]
                            {Record/insert}
                                [Record/traits]
                                    Function
                                [Function/in]
                                    ev
                                [Function/out]
                                    {if}
                                        @record
                                        .{DialogComponent/dialog}
                                        .{Dialog/hasElementInContent}
                                            @ev
                                            .{web.Event/target}
                                    .{then}
                                        {break}
                                    {if}
                                        @record
                                        .{DialogComponent/dialog}
                                        .{Dialog/isCloseable}
                                        .{isFalsy}
                                    .{then}
                                        {break}
                                    {Record/delete}
                                        @record
                                        .{DialogComponent/dialog}
                [1]
                    {Record/insert}
                        [Record/traits]
                            FieldObserver
                        [FieldObserver/event]
                            keydown
                        [FieldObserver/callback]
                            {if}
                                @ev
                                .{KeyboardEvent/key}
                                .{!=}
                                    Escape
                            .{then}
                                {break}
                            {Record/delete}
                                @record
                                .{DialogComponent/dialog}
`;
