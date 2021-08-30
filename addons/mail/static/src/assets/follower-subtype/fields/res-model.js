/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        AKU FIXME: use relation instead
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            resModel
        [Field/model]
            FollowerSubtype
        [Field/type]
            attr
        [Field/target]
            String
`;
