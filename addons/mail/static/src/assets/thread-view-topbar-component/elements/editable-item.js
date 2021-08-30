/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            editableItem
        [Element/model]
            ThreadViewTopbarComponent
        [web.Element/style]
            [web.scss/border]
                {scss/$border-width}
                solid
`;
