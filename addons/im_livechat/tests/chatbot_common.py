# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo.tests import common


class ChatbotCase(common.TransactionCase):
    @classmethod
    def setUpClass(cls):
        super(ChatbotCase, cls).setUpClass()

        cls.chatbot = cls.env['im_livechat.chatbot.script'].create({
            'name': 'Testing Bot',
            'step_ids': [(0, 0, {
                'type': 'text',
                'message': "Hello! I'm a bot!"
            }), (0, 0, {
                'type': 'text',
                'message': "I help lost visitors find their way."
            }), (0, 0, {
                'type': 'question_selection',
                'message': "How can I help you?",
                'answer_ids': [(0, 0, {
                    'name': "Create a Lead",
                }), (0, 0, {
                    'name': "Create a Ticket"
                })]
            }), (0, 0, {
                'type': 'text',
                'message': "Ok bye!"
            })]
        })
