/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            DiscussContainerComponent
        [Model/template]
            root
                discuss
                spinner
                    spinnerIcon
                    spinnerLabel
`;
