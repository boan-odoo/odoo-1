/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            part2Partner
        [Element/model]
            ComposerSuggestionComponent
        [web.Element/tag]
            span
        [Record/traits]
            ComposerSuggestionComponent/part2
        [Element/isPresent]
            @record
            .{ComposerSuggestionComponent/modelName}
            .{=}
                Partner
            .{&}
                @record
                .{ComposerSuggestionComponent/record}
                .{Partner/email}
        [web.Element/textContent]
            {String/sprintf}
                [0]
                    {Locale/text}
                        (%s)
                [1]
                    @record
                    .{ComposerSuggestionComponent/record}
                    .{Partner/email}
`;
