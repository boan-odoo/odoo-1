/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            structuralNext
        [Field/model]
            DefinitionChunk
        [Field/type]
            one
        [Field/target]
            DefinitionChunk
        [Field/inverse]
            DefinitionChunk/structuralPrevious
`;
