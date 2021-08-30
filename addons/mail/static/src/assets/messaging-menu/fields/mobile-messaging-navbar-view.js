/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        The navbar view on the messaging menu when in mobile.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            mobileMessagingNavbarView
        [Field/model]
            MessagingMenu
        [Field/type]
            one
        [Field/target]
            MobileMessagingNavbarView
        [Field/isCausal]
            true
        [Field/inverse]
            MobileMessagingNavbarView/messagingMenu
        [Field/compute]
            {if}
                {Device/isMobile}
            .{then}
                {Record/insert}
                    [Record/traits]
                        MobileMesagingNavbarView
            .{else}
                {Record/empty}
`;
