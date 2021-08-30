/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ElementAddon
        [ElementAddon/element]
            ComposerViewComponent/buttonAttachment
        [ElementAddon/feature]
            hr_holidays
        [ElementAddon/isPresent]
            @original
            .{&}
                @record
                .{ComposerViewComponent/composerView}
                .{ComposerView/composer}
                .{Composer/activeThread}
                .{isFalsy}
                .{|}
                    @record
                    .{ComposerViewComponent/composerView}
                    .{ComposerView/composer}
                    .{Composer/activeThread}
                    .{Thread/channelType}
                    .{!=}
                        livechat
`;
