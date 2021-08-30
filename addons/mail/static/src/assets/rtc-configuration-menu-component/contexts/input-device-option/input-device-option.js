/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Context
        [Context/name]
            inputDeviceOption
        [Context/model]
            RtcConfigurationMenuComponent
        [Model/fields]
        [Model/template]
            inputDeviceOptionForeach
                inputDeviceOption
`;
