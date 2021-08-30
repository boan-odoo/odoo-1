/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Rtc/undeafen
        [Action/behavior]
            {Rtc/_setDeafState}
                false
            {SoundEffect/play}
                {SoundEffects/undeafen}
`;
