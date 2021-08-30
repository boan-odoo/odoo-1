/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            volumeSetting
        [Field/model]
            Guest
        [Field/type]
            one
        [Field/target]
            VolumeSetting
        [Field/inverse]
            VolumeSetting/guest
`;
