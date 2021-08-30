/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Discuss/handleAddChannelAutocompleteSource
        [Action/params]
            discuss
            req
            res
        [Action/behavior]
            {Record/update}
                [0]
                    discuss
                [1]
                    [Discuss/addingChannelValue]
                        @req
                        .{Dict/get}
                            term
            :threads
                {Thread/searchChannelsToOpen}
                    [limit]
                        10
                    [searchTerm]
                        @req
                        .{Dict/get}
                            term
            :items
                @threads
                .{Collection/map}
                    {Record/insert}
                        [Record/traits]
                            Function
                        [Function/in]
                            item
                        [Function/out]
                            :escapedName
                                {String/escape}
                                    @thread
                                    .{Thread/name}
                            {Record/insert}
                                [Record/traits]
                                    Dict
                                [id]
                                    @thread
                                    .{Thread/id}
                                [label]
                                    @escapedName
                                [value]
                                    @escapedName
            :escapedValue
                {String/escape}
                    @req
                    .{Dict/get}
                        term
            {Dev/comment}
                XDU FIXME could use a component but be careful with owl's
                renderToString https://github.com/odoo/owl/issues/708
            {Collection/push}
                [0]
                    @items
                [1]
                    {Record/insert}
                        [Record/traits]
                            Dict
                        [label]
                            {String/sprintf}
                                [0]
                                    <strong>
                                    .{+}
                                        {Locale/text}
                                            Create %s
                                    .{+}
                                        </strong>
                                [1]
                                    <em><span class="fa fa-hashtag"/>
                                    .{+}
                                        @escapedValue
                                    .{+}
                                        </em>
                        [escapedValue]
                            @escapedValue
                        [special]
                            public
                    {Record/insert}
                        [Record/traits]
                            Dict
                        [label]
                            {String/sprintf}
                                [0]
                                    <strong>
                                    .{+}
                                        {Locale/text}
                                            Create %s
                                    .{+}
                                        </strong>
                                [1]
                                    <em><span class="fa fa-lock"/>
                                    .{+}
                                        @escapedValue
                                    .{+}
                                        </em>
                        [escapedValue]
                            @escapedValue
                        [special]
                            private
            @res
                @items
`;
