/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Chatter/showLogNote
        [Action/params]
            chatter
        [Action/behavior]
            {Record/update}
                [0]
                    @chatter
                [1]
                    [Chatter/composerView]
                        {Record/insert}
                            [Record/traits]
                                ComposerView
            {Record/update}
                [0]
                    @chatter
                    .{Chatter/composerView}
                    .{ComposerView/composer}
                [1]
                    [Composer/isLog]
                        true
            {Chatter/focus}
                @chatter
`;
