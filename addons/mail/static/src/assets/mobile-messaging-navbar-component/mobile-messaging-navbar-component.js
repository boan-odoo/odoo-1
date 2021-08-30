/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            MobileMessagingNavbarComponent
        [Model/fields]
            mobileMessagingNavbarView
        [Model/template]
            root
                tabForeach
`;
