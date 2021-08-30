/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Context
        [Context/name]
            itemExtra
        [Context/model]
            ComposerSuggestionListComponent
        [Model/fields]
            record
        [Model/template]
            itemExtraForeach
                itemExtra
`;
