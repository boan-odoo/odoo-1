/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            threadNeedactionPreviewView
        [Field/model]
            ThreadNeedactionPreviewComponent
        [Field/type]
            one
        [Field/target]
            ThreadNeedactionPreviewView
        [Field/isRequired]
            true
`;
