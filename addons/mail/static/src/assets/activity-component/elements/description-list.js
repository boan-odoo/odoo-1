/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            descriptionList
        [Element/model]
            ActivityComponent
        [web.Element/class]
            d-md-table
            table
            table-sm
            mt-2
            mb-3
`;
