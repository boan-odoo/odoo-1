/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            MessagingMenuComponent/getTabs
        [Action/returns]
            Collection<Object>
        [Action/behavior]
            {Record/insert}
                [Record/traits]
                    Collection
                [0]
                    [icon]
                        fa
                        fa-envelope
                    [id]
                        all
                    [label]
                        {Locale/text}
                            All
                [1]
                    [icon]
                        fa
                        fa-user
                    [id]
                        chat
                    [label]
                        {Locale/text}
                            Chat
                [2]
                    [icon]
                        fa
                        fa-users
                    [id]
                        channel
                    [label]
                        {Locale/text}
                            Channel
`;
