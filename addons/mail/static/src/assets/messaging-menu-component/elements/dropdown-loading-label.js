/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            dropdownLoadingLabel
        [Element/model]
            MessagingMenuComponent
        [web.Element/tag]
            span
        [Element/isPresent]
            {Messaging/isInitialized}
        [web.Element/textContent]
            {Locale/text}
                Please wait...
`;
