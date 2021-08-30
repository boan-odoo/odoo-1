/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Determines the last selection direction of the last composer related
        to this thread. Useful to sync the composer when re-creating it.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            textInputSelectionDirectionBackup
        [Field/model]
            Thread
        [Field/type]
            attr
        [Field/target]
            String
        [Field/default]
            none
`;
