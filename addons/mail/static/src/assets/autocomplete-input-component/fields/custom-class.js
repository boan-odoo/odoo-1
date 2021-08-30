/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            customClass
        [Field/model]
            AutocompleteInputComponent
        [Field/type]
            attr
        [Field/target]
            String
`;
