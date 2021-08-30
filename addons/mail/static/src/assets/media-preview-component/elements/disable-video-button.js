/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            disableVideoButton
        [Element/model]
            MediaPreviewComponent
        [Record/traits]
            MediaPreviewComponent/button
        [web.Element/class]
            btn-dark
            border-light
            fa-video-camera
        [Element/isPresent]
            @record
            .{MediaPreviewComponent/mediaPreview}
            .{MediaPreview/isVideoEnabled}
        [Element/onClick]
            {MediaPreview/onClickDisableVideoButton}
                [0]
                    @record
                    .{MediaPreviewComponent/mediaPreview}
                [1]
                    @ev
`;
