/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            Country
        [Model/fields]
            code
            flagUrl
            id
            name
        [Model/id]
            Country/id
`;
