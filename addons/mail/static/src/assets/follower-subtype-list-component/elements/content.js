/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            content
        [Element/model]
            FollowerSubtypeListComponent
        [web.Element/class]
            modal-content
`;
