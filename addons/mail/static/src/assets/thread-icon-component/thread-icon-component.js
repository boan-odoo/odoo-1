/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            ThreadIconComponent
        [Model/fields]
            thread
        [Model/template]
            root
                channelPrivate
                channelPublic
                typingChat
                onlineIcon
                offlineIcon
                awayIcon
                botIcon
                noImStatus
                groupIcon
                mailboxInbox
                mailboxStarred
                mailboxHistory
`;
