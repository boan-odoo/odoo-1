/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            isCompact
        [Field/model]
            ComposerTextInputComponent
        [Field/type]
            attr
        [Field/target]
            Boolean
        [Field/isRequired]
            true
`;
