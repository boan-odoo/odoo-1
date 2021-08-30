/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            threadViewTopbar
        [Field/model]
            ThreadViewTopbarComponent
        [Field/type]
            one
        [Field/target]
            ThreadViewTopbar
        [Field/inverse]
            ThreadViewTopbarComponent/threadViewTopbarComponents
`;
