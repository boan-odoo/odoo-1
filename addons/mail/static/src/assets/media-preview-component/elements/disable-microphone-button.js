/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            disableMicrophoneButton
        [Element/model]
            MediaPreviewComponent
        [Record/traits]
            MediaPreviewComponent/button
        [web.Element/class]
            btn-dark
            border-light
            fa-microphone
        [Element/isPresent]
            @record
            .{MediaPreviewComponent/mediaPreview}
            .{MediaPreview/isMicrophoneEnabled}
        [Element/onClick]
            {MediaPreview/onClickDisableMicrophoneButton}
                [0]
                    @record
                    .{MediaPreviewComponent/mediaPreview}
                [1]
                    @ev
`;
