/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            data-oe-id & data-oe-model link redirection on click
        [Test/model]
            MessageViewComponent
        [Test/assertions]
            7
        [Test/scenario]
            :bus
                {Record/insert}
                    [Record/traits]
                        Bus
            {Bus/on}
                [0]
                    @bus
                [1]
                    do-action
                [2]
                    null
                [3]
                    {Record/insert}
                        [Record/traits]
                            Function
                        [Function/in]
                            payload
                        [Function/out]
                            {Test/assert}
                                []
                                    @payload
                                    .{Dict/get}
                                        action
                                    .{Dict/get}
                                        type
                                    .{=}
                                        ir.actions.act_window
                                []
                                    action should open view
                            {Test/assert}
                                []
                                    @payload
                                    .{Dict/get}
                                        action
                                    .{Dict/get}
                                        res_model
                                    .{=}
                                        some.model
                                []
                                    action should open view on 'some.model' model
                            {Test/assert}
                                []
                                    @payload
                                    .{Dict/get}
                                        action
                                    .{Dict/get}
                                        res_id
                                    .{=}
                                        250
                                []
                                    action should open view on 250
                            {Test/step}
                                do-action:openFormView_some.model_250
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
                    [Env/owlEnv]
                        [bus]
                            @bus
            @testEnv
            .{Record/insert}
                [Record/traits]
                    Server
                [Server/data]
                    @record
                    .{Test/data}
            :message
                @testEnv
                .{Record/insert}
                    [Record/traits]
                        Message
                    [Message/body]
                        <p><a href="#" data-oe-id="250" data-oe-model="some.model">some.model_250</a></p>
                    [Message/id]
                        100
            @testEnv
            .{Record/insert}
                [Record/traits]
                    MessageViewComponent
                [MessageViewComponent/message]
                    @message
            {Test/assert}
                []
                    @message
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/content}
                []
                    message should have content
            {Test/assert}
                []
                    @message
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/content}
                    .{web.Element/querySelector}
                        a
                []
                    message content should have a link

            @testEnv
            .{UI/click}
                    @message
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/content}
                    .{web.Element/querySelector}
                        a
            {Test/verifySteps}
                []
                    do-action:openFormView_some.model_250
                []
                    should have open form view on related record after click on link
`;
