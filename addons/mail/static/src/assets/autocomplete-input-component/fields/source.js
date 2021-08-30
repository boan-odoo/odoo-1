/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            source
        [Field/model]
            AutocompleteInputComponent
        [Field/type]
            attr
        [Field/target]
            Function
`;
