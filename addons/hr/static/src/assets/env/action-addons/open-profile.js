/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ActionAddon
        [ActionAddon/action]
            Env/openProfile
        [ActionAddon/feature]
            hr
        [ActionAddon/params]
            id
            model
        [ActionAddon/behavior]
            {if}
                @model
                .{=}
                    hr.employee
                .{|}
                    @model
                    .{=}
                        hr.employee.public
            .{then}
                :employee
                    {Record/traits}
                        [Record/traits]
                            Employee
                        [Employee/id]
                            @id
                {Employee/openProfile}
                    @employee
            .{else}
                    @original
`;
