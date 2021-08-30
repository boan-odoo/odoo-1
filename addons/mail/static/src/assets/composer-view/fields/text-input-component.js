/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        States the OWL text input component of this composer view.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            textInputComponent
        [Field/model]
            ComposerView
        [Field/type]
            attr
        [Field/target]
            ComposerTextInputComponent
        [Field/inverse]
            ComposerTextInputComponent/composerView
`;
