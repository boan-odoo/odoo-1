/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            ChatWindowComponent
        [Model/fields]
            chatWindow
            hasCloseAsBackButton
            isExpandable
            isFullscreen
        [Model/template]
            root
                header
                channelMemberList
                channelInvitationForm
                thread
                newMessageForm
                    newMessageFormLabel
                    newMessageFormInput
        [Model/actions]
            ChatWindowComponent/_applyVisibleOffset
            ChatWindowComponent/_saveThreadScrollTop
            ChatWindowComponent/_update
            ChatWindowComponent/_onAutocompleteSelect
            ChatWindowComponent/_onAutocompleteSource
            ChatWindowComponent/_onWillHideHomeMenu
            ChatWindowComponent/_onWillShowHomeMenu
        [Model/lifecycles]
            onUpdate
`;
