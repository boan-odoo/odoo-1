/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ModelAddon
        [ModelAddon/feature]
            snailmail
        [ModelAddon/model]
            Message
        [ModelAddon/actions]
            Message/cancelLetter
            Message/openFormatLetterAction
            Message/openMissingFieldsLetterAction
            Message/resendLetter
`;
