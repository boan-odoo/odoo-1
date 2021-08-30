/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Generates the html link related to the mentioned partner
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            ComposerView/_generateMentionsLinks
        [Action/params]
            record
                [type]
                    ComposerView
            body
                [type]
                    String
        [Action/returns]
            String
        [Action/behavior]
            {Dev/comment}
                List of mention data to insert in the body.
                Useful to do the final replace after parsing to avoid using the
                same tag twice if two different mentions have the same name.
            :mentions
                {Record/insert}
                    [Record/traits]
                        Collection
            {foreach}
                @record
                .{ComposerView/composer}
                .{Composer/mentionedPartners}
            .{as}
                partner
            .{do}
                :placeholder
                    {String/atSign}
                    .{+}
                        -mention-partner-
                    .{+}
                        @partner
                        .{Partner/id}
                :text
                    {String/atSign}
                    .{+}
                        {String/escape}
                            @partner
                            .{Partner/name}
                {Collection/push}
                    [0]
                        @mentions
                    [1]
                        {Record/insert}
                            [Record/traits]
                                Object
                            [class]
                                o_mail_redirect
                            [id]
                                @partner
                                .{Partner/id}
                            [model]
                                res.partner
                            [placeholder]
                                @placeholder
                            [text]
                                @text
                :body
                    @body
                    .{String/replace}
                        [0]
                            @text
                        [1]
                            @placeholder
            {foreach}
                @record
                .{ComposerView/composer}
                .{Composer/mentionedChannels}
            .{as}
                channel
            .{do}
                :placeholder
                    #-mention-channel-
                    .{+}
                        @channel
                        .{Thread/id}
                :text
                    #
                    .{+}
                        {String/escape}
                            @channel
                            .{Thread/name}
                {Collection/push}
                    [0]
                        @mentions
                    [1]
                        {Record/insert}
                            [Record/traits]
                                Object
                            [class]
                                o_channel_redirect
                            [id]
                                @channel
                                .{Thread/id}
                            [model]
                                mail.channel
                            [placeholder]
                                @placeholder
                            [text]
                                @text
                :body
                    @body
                    .{String/replace}
                        [0]
                            @text
                        [1]
                            @placeholder
            :baseHREF
                @env
                .{Env/owlEnv}
                .{Dict/get}
                    session
                .{Dict/get}
                    url
                .{Function/call}
                    /web
            {foreach}
                @mentions
            .{as}
                mention
            .{do}
                :href
                    href='
                    .{+}
                        @baseHREF
                    .{+}
                        #model=
                    .{+}
                        @mention
                        .{Suggestion/model}
                    .{+}
                        &id=
                    .{+}
                        @mention
                        .{Suggestion/id}
                    .{+}
                        '
                :attClass
                    class='
                    .{+}
                        @mention
                        .{Suggestion/class}
                    .{+}
                        '
                :dataOeId
                    data-oe-id='
                    .{+}
                        @mention
                        .{Suggestion/id}
                    .{+}
                        '
                :dataOeModel
                    data-oe-model='
                    .{+}
                        @mention
                        .{Suggestion/model}
                    .{+}
                        '
                :target
                    target='_blank'
                :link
                    <a 
                    .{+}
                        @href
                    .{+}
                        {String/whitespace}
                    .{+}
                        @attClass
                    .{+}
                        {String/whitespace}
                    .{+}
                        @dataOeId
                    .{+}
                        {String/whitespace}
                    .{+}
                        @dataOeModel
                    .{+}
                        {String/whitespace}
                    .{+}
                        @target
                    .{+}
                        >
                    .{+}
                        @mention
                        .{Suggestion/text}
                    .{+}
                        </a>
                :body
                    @body
                    .{String/replace}
                        [0]
                            @mention
                            .{Suggestion/placeholder}
                        [1]
                            @link
            @body
`;
