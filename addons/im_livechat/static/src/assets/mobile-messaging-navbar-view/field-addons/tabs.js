/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            FieldAddon
        [FieldAddon/field]
            MobileMessagingNavbar/tabs
        [FieldAddon/feature]
            im_livechat
        [FieldAddon/compute]
            {if}
                {Env/pinnedLivechats}
                .{Collection/length}
                .{>}
                    0
            .{then}
                {Record/insert}
                    [Record/traits]
                        Collection
                    @res
                    []
                        [icon]
                            fa
                            fa-comments
                        [id]
                            livechat
                        [label]
                            {Locale/text}
                                Livechat
            .{else}
                @original
`;
