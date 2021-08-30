/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Requests the given requestList data from the server.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Thread/fetchData
        [Action/params]
            requestList
                [type]
                    Collection<String>
            record
                [type]
                    Thread
        [Action/behavior]
            {if}
                @record
                .{Thread/isTemporary}
            .{then}
                {break}
            :requestSet
                {Record/insert}
                    [Record/traits]
                        Set
                    @requestList
            {if}
                @record
                .{Thread/hasActivities}
                .{isFalsy}
            .{then}
                {Set/delete}
                    [0]
                        @requestSet
                    [1]
                        activities
            {if}
                {Set/has}
                    [0]
                        @requestSet
                    [1]
                        attachments
            .{then}
                {Record/update}
                    [0]
                        @record
                    [1]
                        [Thread/isLoadingAttachments]
                            true
            {if}
                {Set/has}
                    [0]
                        @requestSet
                    [1]
                        messages
            .{then}
                {ThreadCache/loadNewMessages}
                    @record
                    .{Thread/cache}
            :data
                {Env/owlEnv}
                .{Dict/get}
                    services
                .{Dict/get}
                    rpc
                .{Function/call}
                    [0]
                        [route]
                            /mail/thread/data
                        [params]
                            [request_list]
                                @requestSet
                            [thread_id]
                                @record
                                .{Thread/id}
                            [thread_model]
                                @record
                                .{Thread/model}
                    [1]
                        [shadow]
                            true
            :activitiesData
                @data
                .{Dict/get}
                    activities
            :attachmentsData
                @data
                .{Dict/get}
                    attachments
            :followersData
                @data
                .{Dict/get}
                    followers
            :suggestedRecipientsData
                @data
                .{Dict/get}
                    suggestedReciients
            {if}
                {Record/exists}
                    @record
                .{isFalsy}
            .{then}
                {break}
            :values
                {Record/insert}
                    [Record/traits]
                        Dict
            {if}
                @activitiesData
            .{then}
                {Record/update}
                    [0]
                        @values
                    [1]
                        [Thread/activities]
                            @activitiesData
                            .{Collection/map}
                                {Record/insert}
                                    [Record/traits]
                                        Function
                                    [Function/in]
                                        activityData
                                    [Function/out]
                                        {Activity/convertData}
                                            @activityData
            {if}
                @attachmentsData
            .{then}
                {Record/update}
                    [0]
                        @values
                    [1]
                        [Thread/areAttachmentsLoaded]
                            true
                        [Thread/isLoadingAttachments]
                            false
                        [Thread/originThreadAttachments]
                            {Record/insert}
                                [Record/traits]
                                    Attachment
                                @attachmentData
            {if}
                @followersData
            .{then}
                {Record/update}
                    [0]
                        @values
                    [1]
                        [Thread/followers]
                            @followersData
                            .{Collection/map}
                                {Record/insert}
                                    [Record/traits]
                                        Function
                                    [Function/in]
                                        followerData
                                    [Function/out]
                                        {Follower/convertData}
                                            @followerData
            {if}
                @suggestedRecipientsData
            .{then}
                :recipientInfoList
                    @suggestedRecipientsData
                    .{Collection/map}
                        {Record/insert}
                            [Record/traits]
                                Function
                            [Function/in]
                                recipientInfoData
                            [Function/out]
                                :partner_id
                                    @recipientInfoData
                                    .{Collection/first}
                                :emailInfo
                                    @recipientInfoData
                                    .{Collection/second}
                                :lang
                                    @recipientInfoData
                                    .{Collection/third}
                                :reason
                                    @recipientInfoData
                                    .{Collection/fourth}
                                :name
                                    {if}
                                        @emailInfo
                                    .{then}
                                        {Utils/parseEmail}
                                            @emailInfo
                                        .{Collection/first}
                                :email
                                    {if}
                                        @emailInfo
                                    .{then}
                                        {Utils/parseEmail}
                                            @emailInfo
                                        .{Collection/second}
                                {Record/insert}
                                    [Record/traits]
                                        Dict
                                    [SuggestedRecipientInfo/email]
                                        @email
                                    [SuggestedRecipientInfo/id]
                                        {Env/getSuggestedRecipientInfoNextTemporaryId}
                                    [SuggestedRecipientInfo/name]
                                        @name
                                    [SuggestedRecipientInfo/lang]
                                        @lang
                                    [SuggestedRecipientInfo/partner]
                                        {if}
                                            @partner_id
                                        .{then}
                                            {Record/insert}
                                                [Record/traits]
                                                    Partner
                                                [Partner/id]
                                                    @partner_id
                                        .{else}
                                            {Record/empty}
                                    [SuggestedRecipientInfo/reason]
                                        @reason
                {Record/update}
                    [0]
                        @values
                    [1]
                        [Thread/suggestedRecipientInfoList]
                            @recipientInfoList
            {Record/update}
                [0]
                    @record
                [1]
                    @values
`;
