/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Id of this user's res.users.settings record.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            resUsersSettingsId
        [Field/model]
            User
        [Field/type]
            attr
`;
