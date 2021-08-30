/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Context
        [Context/name]
            dialog
        [Context/model]
            DialogManagerComponent
        [Model/fields]
            dialog
        [Model/template]
            dialogForeach
                dialog
`;
