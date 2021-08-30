/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            composerForEditing
        [Field/model]
            MessageView
        [Field/type]
            one
        [Field/target]
            Composer
        [Field/isCausal]
            true
        [Field/inverse]
            Composer/messageViewInEditing
`;
