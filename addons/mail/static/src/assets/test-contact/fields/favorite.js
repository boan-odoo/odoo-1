/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            favorite
        [Field/model]
            TestContact
        [Field/type]
            one
        [Field/target]
            TestHobby
        [Field/default]
            {Record/insert}
                [Record/traits]
                    TestHobby
                [TestHobby/description]
                    football
`;
