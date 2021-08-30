/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            composerView
        [Field/model]
            FileUploader
        [Field/type]
            one
        [Field/target]
            ComposerView
        [Field/isReadonly]
            true
        [Field/inverse]
            ComposerView/fileUploader
`;
