/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            part1Partner
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
                Partner
        [web.Element/textContent]
            @record
            .{ComposerSuggestionComponent/record}
            .{Partner/nameOrDisplayName}
`;
