/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Chatter/_prepareAttachmentsLoading
        [Action/params]
            chatter
        [Action/behavior]
            {Record/update}
                [0]
                    @chatter
                [1]
                    [Chatter/_attachmentsLoaderTimeout]
                        {web.Browser/setTimeout}
                            [0]
                                {Record/update}
                                    [0]
                                        chatter
                                    [1]
                                        [Chatter/_isPreparingAttachmentsLoading]
                                            false
                                        [Chatter/isShowingAttachmentsLoading]
                                            true
                            [1]
                                {Env/loadingBaseDelayDuration}
                    [Chatter/_isPreparingAttachmentsLoading]
                        true
`;
