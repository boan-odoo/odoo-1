/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            composerViews
        [Field/model]
            Composer
        [Field/type]
            many
        [Field/target]
            ComposerView
        [Field/isCausal]
            true
        [Field/inverse]
            ComposerView/composer
`;
