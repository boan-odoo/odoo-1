/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Lifecycle
        [Lifecycle/name]
            onWillUpdateProps
        [Lifecycle/model]
            ChatterContainerComponent
        [Lifecycle/behavior]
            {ChatterContainerComponent/_insertFromProps}
                @record
                @nextProps
`;
