/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            dropzoneVisible
        [Field/model]
            ComposerViewComponent
        [Field/type]
            one
        [Field/target]
            DropzoneVisibleComponentHook
`;
