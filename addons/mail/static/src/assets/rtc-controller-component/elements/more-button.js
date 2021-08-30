/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            moreButton
        [Element/model]
            RtcControllerComponent
        [Record/traits]
            RtcControllerComponent/button
        [web.Element/aria-label]
            {Locale/text}
                More
        [web.Element/title]
            {Locale/text}
                More
`;
