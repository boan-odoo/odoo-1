/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Called when typing in the autocomplete input of the 'new_message' chat
        window.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            ChatWindowComponent/_onAutocompleteSource
        [Action/params]
            record
            req
            res
        [Action/behavior]
            {Partner/imSearch}
                [callback]
                    {Record/insert}
                        [Record/traits]
                            Function
                        [Function/in]
                            partners
                        [Function/out]
                            :suggestions
                                @partners
                                .{Collection/map}
                                    {Record/insert}
                                        [Record/traits]
                                            Function
                                        [Function/in]
                                            item
                                        [Function/out]
                                            {Record/insert}
                                                [Record/traits]
                                                    Dict
                                                [id]
                                                    @partner
                                                    .{Partner/id}
                                                [label]
                                                    @partner
                                                    .{Partner/nameOrDisplayName}
                                                [value]
                                                    @partner
                                                    .{Partner/nameOrDisplayName}
                            @res
                                {Collection/sortBy}
                                    @suggestions
                                    label
                [keyword]
                    {String/escape}
                        @req
                        .{Dict/get}
                            term
                [limit]
                    10
`;
