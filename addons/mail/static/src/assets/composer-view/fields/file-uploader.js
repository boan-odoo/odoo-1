/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            fileUploader
        [Field/model]
            ComposerView
        [Field/type]
            one
        [Field/target]
            FileUploader
        [Field/isCausal]
            true
        [Field/isReadonly]
            true
        [Field/isRequired]
            true
        [Field/inverse]
            FileUploader/composerView
        [Field/default]
            {Record/insert}
                [Record/traits]
                    FileUploader
`;
