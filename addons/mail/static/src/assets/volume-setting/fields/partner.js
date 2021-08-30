/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            partner
        [Field/model]
            VolumeSetting
        [Field/type]
            one
        [Field/target]
            Partner
        [Field/inverse]
            Partner/volumeSetting
`;
