/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            DialogComponent
        [Model/fields]
            device
            dialog
        [Model/template]
            root
                component
`;
