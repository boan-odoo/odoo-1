/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            label
        [Element/model]
            RtcOptionListComponent
        [web.Element/tag]
            span
        [web.Element/style]
            {web.scss/include}
                {web.scss/text-truncate}
`;
