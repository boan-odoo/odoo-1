/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            downloadLogsLabel
        [Element/model]
            RtcOptionListComponent
        [Record/traits]
            RtcOptionListComponent/label
        [web.Element/textContent]
            {Locale/text}
                Download logs
`;
