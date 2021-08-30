/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            part1Channel
        [Element/model]
            ComposerSuggestionComponent
        [web.Element/tag]
            span
        [Record/traits]
            ComposerSuggestionComponent/part1
        [Element/isPresent]
            @record
            .{ComposerSuggestionComponent/modelName}
            .{=}
                Thread
        [web.Element/textContent]
            @record
            .{ComposerSuggestionComponent/record}
            .{Thread/name}
`;
