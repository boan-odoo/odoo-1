/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            userSetting
        [Field/model]
            VolumeSetting
        [Field/type]
            one
        [Field/target]
            UserSetting
        [Field/inverse]
            UserSetting/volumeSettings
        [Field/isRequired]
            true
`;
