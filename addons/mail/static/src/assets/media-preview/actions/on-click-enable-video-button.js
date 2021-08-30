/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Handles click on the "enable video" button.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            MediaPreview/onClickEnableVideoButton
        [Action/params]
            record
                [type]
                    MediaPreview
        [Action/behavior]
            {MediaPreview/enableVideo}
                @record
`;
