/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            record
        [Field/model]
            ComposerSuggestionListComponent:itemExtra
        [Field/type]
            one
        [Field/target]
            Record
        [Field/isRequired]
            true
`;
