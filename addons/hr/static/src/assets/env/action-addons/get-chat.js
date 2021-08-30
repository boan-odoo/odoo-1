/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ActionAddon
        [ActionAddon/actionName]
            Env/getChat
        [ActionAddon/feature]
            hr
        [ActionAddon/params]
            employeeId
        [ActionAddon/behavior]
            {if}
                @employeeId
            .{then}
                :employee
                    {Record/insert}
                        [Record/traits]
                            Employee
                        [Employee/id]
                            employeeId
                {Employee/getChat}
                    @employee
            .{else}
                @original
`;
