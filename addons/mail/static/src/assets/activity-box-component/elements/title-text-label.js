/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            titleTextLabel
        [Element/model]
            ActivityBoxComponent
        [web.Element/tag]
            span
        [web.Element/textContent]
            {Locale/text}
                Planned activities
`;
