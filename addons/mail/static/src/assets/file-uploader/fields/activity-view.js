/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            activityView
        [Field/model]
            FileUploader
        [Field/type]
            one
        [Field/target]
            ActvityView
        [Field/isReadonly]
            true
        [Field/inverse]
            ActvityView/fileUploader
`;
