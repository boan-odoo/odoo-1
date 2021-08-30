/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Lifecycle
        [Lifecycle/name]
            onWillUnmount
        [Lifecycle/model]
            AutocompleteInputComponent
        [Lifecycle/behavior]
            {Record/insert}
                [Record/traits]
                    jQuery
                @record
                .{AutocompleteInputComponent/root}
            .{jQuery/autocomplete}
                destroy
`;
