/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            pushToTalkOn
        [Field/model]
            SoundEffects
        [Field/type]
            one
        [Field/target]
            SoundEffect
        [Field/isCausal]
            true
        [Field/default]
            {Record/insert}
                [Record/traits]
                    SoundEffect
                [SoundEffect/defaultVolume]
                    0.05
                [SoundEffect/filename]
                    ptt_push_1
`;
