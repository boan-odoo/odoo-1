/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            DiscussView
        [Model/fields]
            discuss
        [Model/id]
            DiscussView/discuss
`;
