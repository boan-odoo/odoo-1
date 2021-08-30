/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            volume
        [Field/model]
            VolumeSetting
        [Field/type]
            attr
        [Field/target]
            Float
        [Field/default]
            0.5
`;
