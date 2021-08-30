/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            composerView
        [Field/model]
            ComposerTextInputComponent
        [Field/type]
            one
        [Field/target]
            ComposerView
        [Field/isRequired]
            true
        [Field/inverse]
            ComposerView/textInputComponent
`;
