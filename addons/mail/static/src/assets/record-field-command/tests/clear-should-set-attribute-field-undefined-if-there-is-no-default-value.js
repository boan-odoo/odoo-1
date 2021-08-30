/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            clear: should set attribute field undefined if there is no default value
        [Test/model]
            RecordFieldCommand
        [Test/assertions]
            1
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            :task
                @testEnv
                .{Record/insert}
                    [Record/traits]
                        TestTask
                    [TestTask/id]
                        1
                    [TestTask/title]
                        test title 1
            @testEnv
            .{Record/update}
                [0]
                    @record
                [1]
                    [TestTask/title]
                        @testEnv
                        .{Record/empty}
            {Test/assert}
                []
                    @task
                    .{TestTask/title}
                    .{=}
                        undefined
                []
                    clear: should set attribute field undefined if there is no default value
`;
