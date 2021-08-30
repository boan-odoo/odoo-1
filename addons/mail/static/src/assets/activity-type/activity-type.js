/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            ActivityType
        [Model/fields]
            activities
            displayName
            id
        [Model/id]
            Activity/id
`;
