/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Handles click on the "disable video" button.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            MediaPreview/onClickDisableVideoButton
        [Action/params]
            record
                [type]
                    MediaPreview
        [Action/behavior]
            {MediaPreview/disableVideo}
                @record
`;
