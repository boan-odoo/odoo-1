/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            unlinkAll: should set x2one field undefined
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
                    [TestContact/address]
                        @testEnv
                        .{Record/insert}
                            [Record/traits]
                                TestAddress
                            [TestAddress/id]
                                20
                    [TestContact/id]
                        10
            :address
                @testEnv
                .{Record/findById}
                    [TestAddress/id]
                        20
            @testEnv
            .{Record/update}
                [0]
                    @contact
                [1]
                    [TestContact/address]
                        @testEnv
                        .{Record/empty}
            @testEnv
            .{Test/assert}
                []
                    @contact
                    .{TestContact/address}
                    .{=}
                        undefined
                []
                    clear: should set x2one field undefined
            {Test/assert}
                []
                    @address
                    .{TestAddress/contact}
                    .{=}
                        undefined
                []
                    the inverse relation should be cleared as well
`;
