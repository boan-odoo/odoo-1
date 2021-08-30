/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            clear: should set x2many field empty array if no default value is given
        [Test/model]
            RecordFieldCommand
        [Test/assertions]
            2
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            :contact
                @testEnv
                .{Record/insert}
                    [Record/traits]
                        TestContact
                    [TestContact/id]
                        10
                    [TestContact/tasks]
                        @testEnv
                        .{Record/insert}
                            [Record/traits]
                                TestTask
                            [TestTask/id]
                                20
            :task
                @testEnv
                .{Record/findById}
                    [TestTask/id]
                        20
            @testEnv
            .{Record/update}
                [0]
                    @contact
                [1]
                    [TestContact/tasks]
                        @testEnv
                        .{Record/empty}
            {Test/assert}
                []
                    @contact
                    .{TestContact/tasks}
                    .{Collection/length}
                    .{=}
                        0
                []
                    clear: should set x2many field empty array
            {Test/assert}
                []
                    @task
                    .{TestTask/responsible}
                    .{=}
                        undefined
                []
                    the inverse relation should be cleared as well
`;
