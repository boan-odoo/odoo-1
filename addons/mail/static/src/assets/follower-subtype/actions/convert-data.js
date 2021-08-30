/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            FollowerSubtype/convertData
        [Action/params]
            data
                [type]
                    Object
        [Action/behavior]
            :data2
                {Record/insert}
                    [Record/traits]
                        Object
            {if}
                @data
                .{Dict/hasKey}
                    default
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [FollowerSubtype/isDefault]
                            @data
                            .{Dict/get}
                                default
            {if}
                @data
                .{Dict/hasKey}
                    id
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [FollowerSubtype/id]
                            @data
                            .{Dict/get}
                                id
            {if}
                @data
                .{Dict/hasKey}
                    internal
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [FollowerSubtype/isInternal]
                            @data
                            .{Dict/get}
                                internal
            {if}
                @data
                .{Dict/hasKey}
                    name
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [FollowerSubtype/name]
                            @data
                            .{Dict/get}
                                name
            {if}
                @data
                .{Dict/hasKey}
                    parent_model
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [FollowerSubtype/parentModel]
                            @data
                            .{Dict/get}
                                parent_model
            {if}
                @data
                .{Dict/hasKey}
                    res_model
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [FollowerSubtype/resModel]
                            @data
                            .{Dict/get}
                                res_model
            {if}
                @data
                .{Dict/hasKey}
                    sequence
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [FollowerSubtype/sequence]
                            @data
                            .{Dict/get}
                                sequence
            @data2
`;
