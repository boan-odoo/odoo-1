/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        States the OWL component of this composer view.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            component
        [Field/model]
            ComposerView
        [Field/type]
            attr
        [Field/target]
            ComposerViewComponent
        [Field/inverse]
            ComposerViewComponent/composerView
`;
