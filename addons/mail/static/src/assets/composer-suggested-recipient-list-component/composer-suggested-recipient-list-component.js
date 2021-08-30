/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            ComposerSuggestedRecipientListComponent
        [Model/fields]
            hasShowMoreButton
            thread
        [Model/template]
            root
                suggestedRecipientForeach
                showMore
                showLess
`;
