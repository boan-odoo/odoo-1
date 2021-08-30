/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            record
        [Field/model]
            ComposerSuggestionComponent
        [Field/type]
            one
        [Field/isRequired]
            true
`;
