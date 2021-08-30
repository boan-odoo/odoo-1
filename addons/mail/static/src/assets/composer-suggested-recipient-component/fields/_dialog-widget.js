/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            _dialogWidget
        [Field/model]
            ComposerSuggestedRecipientComponent
        [Field/type]
            attr
        [Field/target]
            DialogWidget
`;
