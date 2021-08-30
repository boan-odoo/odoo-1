/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            level
        [Field/model]
            DefinitionChunk
        [Field/type]
            attr
        [Field/target]
            Integer
`;
