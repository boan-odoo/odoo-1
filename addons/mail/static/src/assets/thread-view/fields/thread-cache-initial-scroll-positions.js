/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        List of saved initial scroll positions of thread caches.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            threadCacheInitialScrollPositions
        [Field/model]
            ThreadView
        [Field/type]
            attr
        [Field/related]
            ThreadView/threadViewer
            ThreadViewer/threadCacheInitialScrollPositions
        [Field/default]
            {Record/insert}
                [Record/traits]
                    Dict
`;
