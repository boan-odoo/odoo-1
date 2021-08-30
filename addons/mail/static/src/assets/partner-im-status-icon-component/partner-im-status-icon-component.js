/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            PartnerImStatusIconComponent
        [Model/fields]
            hasBackground
            hasOpenChat
            partner
        [Model/template]
            root
                outerBackground
                innerBackground
                iconOnline
                iconAway
                iconOffline
                iconBot
`;
