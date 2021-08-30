/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            layoutLabel
        [Element/model]
            RtcOptionListComponent
        [Record/traits]
            RtcOptionListComponent/label
        [web.Element/textContent]
            {Locale/text}
                Change Layout
`;
