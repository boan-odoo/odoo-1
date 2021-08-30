/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            away
        [Element/model]
            ThreadIconComponent
        [web.Element/style]
            [web.scss/color]
                {scss/theme-color}
                    warning
`;
