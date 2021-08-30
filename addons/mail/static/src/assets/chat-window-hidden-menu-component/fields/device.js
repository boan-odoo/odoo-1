/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        The intent of the toggle button depends on the last rendered state.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            device
        [Field/model]
            ChatWindowHiddenMenuComponent
        [Field/type]
            one
        [Field/target]
            Device
        [Field/compute]
            {Env/device}
        [Field/observe]
            {Dev/comment}
                Closes the menu when clicking outside.
                Must be done as capture to avoid stop propagation.
            {Record/insert}
                [Record/traits]
                    FieldObserver
                [FieldObserver/event]
                    click
                [FieldObserver/callback]
                    {Record/insert}
                        [Record/traits]
                            Function
                        [Function/in]
                            ev
                        [Function/out]
                            {if}
                                @record
                                .{ChatWindowHiddenMenuComponent/root}
                                .{web.Element/contains}
                                    @ev
                                    .{web.Event/target}
                                .{isFalsy}
                            .{then}
                                {ChatWindowManager/closeHiddenMenu}
`;
