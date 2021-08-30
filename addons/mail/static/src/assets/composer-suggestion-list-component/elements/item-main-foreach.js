/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            itemMainForeach
        [Element/model]
            ComposerSuggestionListComponent
        [Record/traits]
            Foreach
        [Field/target]
            ComposerSuggestionListComponent:itemMain
        [ComposerSuggestionListComponent:itemMain/record]
            @field
            .{Foreach/get}
                record
        [Foreach/collection]
            @record
            .{ComposerSuggestionListComponent/composerView}
            .{ComposerView/mainSuggestedRecords}
        [Foreach/as]
            record
        [Element/key]
            @field
            .{Foreach/get}
                record
            .{Record/id}
`;
