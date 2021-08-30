/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            ComposerSuggestionListComponent
        [Model/fields]
            composerView
            isBelow
        [Model/template]
            root
                drop
                    list
                        itemMainForeach
                        separator
                        itemExtraForeach
`;
