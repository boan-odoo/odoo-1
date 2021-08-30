/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            ChatWindow
        [Model/fields]
            channelInvitationForm
            hasCallButtons
            hasInviteFeature
            hasNewMessageForm
            hasShiftNext
            hasShiftPrev
            hasThreadView
            isDoFocus
            isFocused
            isFolded
            isMemberListOpened
            isVisible
            manager
            managerAsNewMessage
            name
            thread
            threadView
            threadViewer
            visibleIndex
            visibleOffset
        [Model/is]
            ChatWindow/manager
            .{&}
                ChatWindow/thread
                .{|}
                    ChatWindow/managerAsNewMessage
        [Model/actions]
            ChatWindow/_getNextVisibleUnfoldedChatWindow
            ChatWindow/close
            ChatWindow/expand
            ChatWindow/focus
            ChatWindow/focusNextVisibleUnfoldedChatWindow
            ChatWindow/focusPreviousVisibleUnfoldedChatWindow
            ChatWindow/fold
            ChatWindow/makeActive
            ChatWindow/makeVisible
            ChatWindow/onClickHideInviteForm
            ChatWindow/onClickHideMemberList
            ChatWindow/onClickShowInviteForm
            ChatWindow/onClickShowMemberList
            ChatWindow/onFocusInNewMessageFormInput
            ChatWindow/shiftNext
            ChatWindow/shiftPrev
            ChatWindow/unfold
`;
