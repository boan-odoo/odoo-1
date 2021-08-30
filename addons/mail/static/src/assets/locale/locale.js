/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            Locale
        [Model/fields]
            language
            textDirection
        [Model/id]
            Locale/messaging
`;
