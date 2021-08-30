/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        audio MediaStreamTrack of the current user
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            audioTrack
        [Field/model]
            Rtc
        [Field/type]
            attr
        [Field/target]
            MediaStreamTrack
`;
