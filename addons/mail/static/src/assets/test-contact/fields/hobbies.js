/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            hobbies
        [Field/model]
            TestContact
        [Field/type]
            many
        [Field/target]
            TestHobby
        [Field/default]
            {Record/insert}
                []
                    [Record/traits]
                        TestHobby
                    [TestHobby/description]
                        hiking
                []
                    [Record/traits]
                        TestHobby
                    [TestHobby/description]
                        fishing
`;
