/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            composerView
        [Field/model]
            ComposerSuggestionComponent
        [Field/type]
            one
        [Field/target]
            ComposerView
        [Field/isRequired]
            true
`;
