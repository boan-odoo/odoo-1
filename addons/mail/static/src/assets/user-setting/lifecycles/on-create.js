/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Lifecycle
        [Lifecycle/name]
            onCreate
        [Lifecycle/model]
            UserSetting
        [Lifecycle/behavior]
            {UserSetting/loadLocalSettings}
                @record
`;
