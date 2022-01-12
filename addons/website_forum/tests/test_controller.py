# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import json
from odoo.tests.common import HttpCase, new_test_user


class TestController(HttpCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        portal_user = new_test_user(cls.env, login='portal_user', groups='base.group_portal')
        cls.portal = portal_user.login
        admin_user = new_test_user(cls.env, login='admin_user', groups='base.group_user,base.group_system')
        cls.admin = admin_user.login

        cls.headers = {"Content-Type": "application/json"}

        cls.error = "odoo.exceptions.AccessError"

    def _build_payload(self, params=None):
        """
        Helper to properly build jsonrpc payload
        """
        return {
            "jsonrpc": "2.0",
            "method": "call",
            "id": 0,
            "params": params or {},
        }

    def test_portal_fetch_attachment(self):
        self.authenticate(self.portal, self.portal)
        payload = self._build_payload({"res_model": "forum.post"})
        response = self.url_open('/web_editor/attachment/fetch', data=json.dumps(payload), headers=self.headers)
        self.assertEqual(200, response.status_code)
        self.assertNotIn(self.error, response.text)

    def test_portal_add_attachment(self):
        self.authenticate(self.portal, self.portal)
        pixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNgYGAAAAAEAAH2FzhVAAAAAElFTkSuQmCC'
        payload = self._build_payload({"name": "pixel", "data": pixel, "is_image": True, "res_model": "forum.post"})
        response = self.url_open('/web_editor/attachment/add_data', data=json.dumps(payload), headers=self.headers)
        self.assertEqual(200, response.status_code)
        self.assertNotIn(self.error, response.text)
