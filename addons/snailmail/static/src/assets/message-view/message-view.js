/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ModelAddon
        [ModelAddon/feature]
            snailmail
        [ModelAddon/model]
            MessageView
        [ModelAddon/fields]
            snailmailErrorDialog
        [ModelAddon/actionAddons]
            MessageView/onClickFailure
`;
