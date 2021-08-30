/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            DiscussComponent/getMobileNavbarTabs
        [Action/behavior]
            {Record/insert}
                [Record/traits]
                    Collection
                [0]
                    {Record/insert}
                        [Record/traits]
                            Dict
                        [icon]
                            fa fa-inbox
                        [id]
                            mailbox
                        [label]
                            {Locale/text}
                                Mailboxes
                [1]
                    {Record/insert}
                        [Record/traits]
                            Dict
                        [icon]
                            fa fa-user
                        [id]
                            chat
                        [label]
                            {Locale/text}
                                Chat
                [2]
                    {Record/insert}
                        [Record/traits]
                            Dict
                        [icon]
                            fa fa-users
                        [id]
                            channel
                        [label]
                            {Locale/text}
                                Channel
`;
