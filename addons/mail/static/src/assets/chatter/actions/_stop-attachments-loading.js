/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Chatter/_stopAttachmentsLoading
        [Action/params]
            chatter
        [Action/behavior]
            {web.Browser/clearTimeout}
                @chatter
                .{Chatter/_attachmentsLoaderTimeout}
            {Record/update}
                [0]
                    @chatter
                [1]
                    [Chatter/_attachmentsLoaderTimeout]
                        null
                    [Chatter/_isPreparingAttachmentsLoading]
                        false
                    [Chatter/isShowingAttachmentsLoading]
                        false
`;
