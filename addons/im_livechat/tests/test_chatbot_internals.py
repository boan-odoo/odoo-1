# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo.addons.im_livechat.tests import chatbot_common


class ChatbotCase(chatbot_common.ChatbotCase):
    def test_welcome_steps(self):
        """ see '_filtered_welcome_steps' for more details. """

        welcome_steps = self.chatbot.step_ids._filtered_welcome_steps()
        self.assertEqual(len(welcome_steps), 3)
        self.assertEqual(welcome_steps, self.chatbot.step_ids[0:3])

        self.chatbot.step_ids[0:2].unlink()
        welcome_steps = self.chatbot.step_ids._filtered_welcome_steps()
        self.assertEqual(len(welcome_steps), 1)
        self.assertEqual(welcome_steps, self.chatbot.step_ids[0])
