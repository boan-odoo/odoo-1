/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Employee related to this user.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            employee
        [Field/model]
            User
        [Field/feature]
            hr
        [Field/type]
            one
        [Field/target]
            Employee
        [Field/inverse]
            Employee/user
`;
