/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            buttonScheduleActivityLabel
        [Element/model]
            ChatterTopbarComponent
        [web.Element/tag]
            span
        [web.Element/textContent]
            {Locale/text}
                Schedule activity
`;
