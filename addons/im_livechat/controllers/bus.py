# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from markupsafe import Markup
from odoo.addons.mail.controllers.bus import MailChatController


class LiveChatMailController(MailChatController):
    def _chat_post_prepare_message_content(self, message_content, **kwargs):
        """ When we post an automated chatbot answer on behalf of the user, we want to wrap it into
        some custom styling.

        Ideally the message should be flagged and the styling done on the template, but this would
        require adding fields on mail.message, so let's avoid that and do a small patch here instead. """

        body = super(LiveChatMailController, self)._chat_post_prepare_message_content(message_content, **kwargs)

        if kwargs.get('wrap_chatbot_answer'):
            body = Markup(
                '<div class="o_livechat_chatbot_answer d-inline-block border rounded p-2 mr-3 font-weight-bold bg-primary">'
                '%s'
                '</div>') % body

        return body
