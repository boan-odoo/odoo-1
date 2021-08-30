/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            DialogManager
        [Model/fields]
            dialogs
        [Model/id]
            DialogManager/messaging
`;
