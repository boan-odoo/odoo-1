/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            body
        [Element/model]
            FollowerSubtypeListComponent
        [web.Element/tag]
            main
        [web.Element/class]
            modal-body
`;
