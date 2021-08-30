/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            markDoneButtonLabel
        [Element/model]
            ActivityComponent
        [web.Element/tag]
            span
        [web.Element/textContent]
            {Locale/text}
                Mark Done
`;
