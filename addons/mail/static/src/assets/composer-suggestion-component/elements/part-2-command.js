/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            part2Command
        [Element/model]
            ComposerSuggestionComponent
        [web.Element/tag]
            span
        [Record/traits]
            ComposerSuggestionComponent/part2
        [web.Element/textContent]
            @record
            .{ComposerSuggestionComponent/record}
            .{ChannelCommand/help}
`;
