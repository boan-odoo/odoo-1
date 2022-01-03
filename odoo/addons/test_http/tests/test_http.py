# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import json

from unittest.mock import patch

from odoo.tests import common, tagged
from odoo.tools import mute_logger
from odoo import conf


# Add test_http into wide modules to allow the routes with auth='none'
conf.server_wide_modules.append('test_http')

@tagged('post_install', '-at_install')
class test_http(common.HttpCase):

    def nodb_url_open(self, *arg, allow_redirects=False, **kwargs):
        with patch('odoo.http.db_list') as mock:
            mock.return_value = []
            return self.url_open(*arg, allow_redirects=allow_redirects, **kwargs)

    def test_greeting(self):
        test_matrix = [
            # path, database?, login, expected code, expected re pattern
            ('/test_http/greeting', False, None, 200, r"Tek'ma'te"),
            ('/test_http/greeting', True, None, 200, r"Tek'ma'te"),
            ('/test_http/greeting', True, 'public', 200, r"Tek'ma'te"),
            ('/test_http/greeting', True, 'demo', 200, r"Tek'ma'te"),
            ('/test_http/greeting-none', False, None, 200, r"Tek'ma'te"),
            ('/test_http/greeting-none', True, None, 200, r"Tek'ma'te"),
            ('/test_http/greeting-none', True, 'public', 200, r"Tek'ma'te"),
            ('/test_http/greeting-none', True, 'demo', 200, r"Tek'ma'te"),
            ('/test_http/greeting-public', False, None, 404, r"Not Found"),
            ('/test_http/greeting-public', True, None, 200, r"Tek'ma'te"),
            ('/test_http/greeting-public', True, 'public', 200, r"Tek'ma'te"),
            ('/test_http/greeting-public', True, 'demo', 200, r"Tek'ma'te"),
            ('/test_http/greeting-user', False, None, 404, r"Not Found"),
            ('/test_http/greeting-user', True, None, 303, r".*/web/login.*"),
            ('/test_http/greeting-user', True, 'public', 303, r".*/web/login.*"),
            ('/test_http/greeting-user', True, 'demo', 200, r"Tek'ma'te"),
        ]

        for path, withdb, login, expected_code, expected_pattern in test_matrix:
            with self.subTest(path=path, withdb=withdb, login=login):
                if withdb:
                    if login == 'public':
                        self.authenticate(None, None)
                    elif login:
                        self.authenticate(login, login)

                    res = self.url_open(path, allow_redirects=False)
                else:
                    res = self.nodb_url_open(path, allow_redirects=False)

                self.assertEqual(res.status_code, expected_code, f"'{path}' returns wrong status code")
                self.assertRegex(res.text, expected_pattern, f"'{path}' returns wrong content")

                self.logout()

    def test_headers_1(self):
        res = self.nodb_url_open('/test_http/greeting')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.reason, 'OK')
        self.assertEqual(res.encoding, 'utf-8')
        self.assertEqual(res.text, "Tek'ma'te")
        self.assertIn('Content-Type', res.headers)
        self.assertEqual(res.headers['Content-Type'], 'text/html; charset=utf-8')
        self.assertNotIn('Set-Cookie', res.headers) # no cookie because the session_id create from the hash and db_name

        res = self.nodb_url_open('/test_http/greeting-none')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.text, "Tek'ma'te")

    def test_headers_2(self):
        res = self.url_open('/test_http/greeting')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.text, "Tek'ma'te")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.reason, 'OK')
        self.assertEqual(res.encoding, 'utf-8')
        self.assertIn('Content-Type', res.headers)
        self.assertEqual(res.headers['Content-Type'], 'text/html; charset=utf-8')
        self.assertIn('Set-Cookie', res.headers)
        self.assertIn(f'.{self.cr.dbname}', res.headers['Set-Cookie'])

    def test_headers_3(self):
        headers = {
            "Content-Type": "application/json",
        }
        res = self.nodb_url_open("/test_http/echo-json", data='{}', headers=headers)
        self.assertEqual(res.headers['Content-Type'], 'application/json') # from the controller type

    def test_headers_4(self):
        res = self.nodb_url_open("/test_http/headers")
        self.assertEqual(res.headers['Content-Type'], 'application/json; charset=toto') # from the controller headers return

    def test_echo_http_1(self):
        res = self.nodb_url_open("/test_http/echo-http-get?enemy=goa'uld")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.text, "{'enemy': \"goa'uld\"}")

    def test_echo_http_2(self):
        data = {
            'lord': 'Apophis',
        }
        res = self.nodb_url_open("/test_http/echo-http-get", data=data)
        self.assertEqual(res.status_code, 405)

    def test_echo_http_3(self):
        data = {
            'lord': 'Apophis',
        }
        res = self.nodb_url_open("/test_http/echo-http-post?enemy=goa'uld", data=data)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.text, "{'enemy': \"goa'uld\", 'lord': 'Apophis'}")

    def test_echo_http_4(self):
        headers = {
            "Content-Type": "application/json",
        }
        res = self.nodb_url_open("/test_http/echo-http-post?enemy=goa'uld", headers=headers)
        self.assertIn('405 Method Not Allowed', res.text)

    @mute_logger('odoo.http')
    def test_echo_http_5(self):
        headers = {
            "Content-Type": "application/json",
        }
        payload = {
            'lord': 'Apophis',
        }
        res = self.nodb_url_open("/test_http/echo-http-post?enemy=goa'uld", data=json.dumps(payload), headers=headers)
        self.assertIn('400 Bad Request', res.text)

    @mute_logger('odoo.http')
    def test_echo_http_6(self):
        headers = {
            "Content-Type": "application/json",
        }
        payload = {
            "jsonrpc": "2.0",
            "id": 0,
            "params": {
                'lord': 'Apophis',
            },
        }
        res = self.nodb_url_open("/test_http/echo-http-post?enemy=goa'uld", data=json.dumps(payload), headers=headers)
        self.assertIn('400 Bad Request', res.text)

    @mute_logger('odoo.http')
    def test_echo_json_1(self):
        res = self.nodb_url_open("/test_http/echo-json?enemy=goa'uld", data={'lord': 'Apophis'})
        self.assertIn("Bad Request", res.text)

    def test_echo_json_2(self):
        headers = {
            "Content-Type": "application/json",
        }
        payload = {
            'lord': 'Apophis'
        }
        res = self.nodb_url_open("/test_http/echo-json?enemy=goa'uld", data=json.dumps(payload), headers=headers)
        self.assertEqual(res.text, '{"jsonrpc": "2.0", "id": null, "result": {"payload": {"lord": "Apophis"}, "kwargs": {}}}')

    def test_echo_json_3(self):
        headers = {
            "Content-Type": "application/json",
        }
        payload = {
            "jsonrpc": "2.0",
            "id": 0,
            "params": {
                'lord': 'Apophis',
            },
        }
        res = self.nodb_url_open("/test_http/echo-json?enemy=goa'uld", data=json.dumps(payload), headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.text, '{"jsonrpc": "2.0", "id": 0, "result": {"payload": {"jsonrpc": "2.0", "id": 0, "params": {"lord": "Apophis"}}, "kwargs": {"lord": "Apophis"}}}')

    def test_echo_json_context_1(self):
        self.authenticate('demo', 'demo')

        headers = {
            "Content-Type": "application/json",
        }
        payload = {
            "jsonrpc": "2.0",
            "id": 0,
            "params": {
                "enemy": "goa'uld",
            },
        }
        res = self.url_open("/test_http/echo-json-context", data=json.dumps(payload), headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.text, '{"jsonrpc": "2.0", "id": 0, "result": {"lang": "en_US", "tz": "Europe/Brussels", "uid": %s}}' % self.session.uid)

    def test_galaxy_1(self):
        milky_way = self.env.ref('test_http.milky_way')

        res = self.url_open(f"/test_http/{milky_way.id}")

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.text, '''<p>Milky Way</p>
            <ul>
                <li>
                    <a href="/test_http/1/1">
                        Earth (P4X-279)
                    </a>
                </li><li>
                    <a href="/test_http/1/2">
                        Abydos (P2X-742)
                    </a>
                </li><li>
                    <a href="/test_http/1/3">
                        Dakara (P5C-744)
                    </a>
                </li>
            </ul>''')

    @mute_logger('odoo.http')
    def test_galaxy_2(self):
        res = self.url_open("/test_http/999") # unknown galaxy

        self.assertEqual(res.status_code, 400)
        self.assertIn('The Ancients did not settle there.', res.text)

    def test_stargate_1(self):
        self.authenticate('demo', 'demo')

        milky_way = self.env.ref('test_http.milky_way')
        earth = self.env.ref('test_http.earth')

        res = self.url_open(f"/test_http/{milky_way.id}/{earth.id}")

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.text, '''<dl>
                    <dt>name</dt><dd>Earth</dd>
                    <dt>address</dt><dd>sq5Abt</dd>
                    <dt>sgc_designation</dt><dd>P4X-279</dd>
            </dl>''')

    @mute_logger('odoo.http')
    def test_stargate_2(self):
        self.authenticate('demo', 'demo')

        milky_way = self.env.ref('test_http.milky_way')

        res = self.url_open(f"/test_http/{milky_way.id}/9999") # unknown gate

        self.assertEqual(res.status_code, 400)
        self.assertIn("The goa'uld destroyed the gate", res.text)

    def test_redirect_1(self):
        res = self.url_open("/test_http/redirect-double-slash", allow_redirects=False)
        self.assertEqual(res.status_code, 302)
        self.assertIn("/test_http//greeting", res.text)

    def test_redirect_2(self):
        res = self.url_open("/test_http/redirect-double-slash")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.text, "Tek'ma'te")

    def test_redirect_3(self):
        res = self.url_open("/test_http//greeting", allow_redirects=False)
        self.assertEqual(res.status_code, 301)
        self.assertIn("/test_http/greeting", res.text)

    def test_redirect_4(self):
        res = self.url_open("/test_http//greeting")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.text, "Tek'ma'te")

    def test_static_1(self):
        # sg1 found a new artefact

        res = self.nodb_url_open("/test_http/static/src/img/48px-StargateGlyph01.png")

        self.assertEqual(res.status_code, 200)
        self.assertIn('PNG', res.text)

    def test_static_2(self):
        # sg1 cannot explore this, because it's not a static object

        res = self.nodb_url_open("/test_http/security/ir.model.access.csv")

        self.assertEqual(res.status_code, 404)

    def test_sg1(self):
        # test env with user name and the redirection

        self.authenticate('admin', 'admin')

        res = self.url_open("/test_http/1/3")

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.text, '''<dl>
                    <dt>galaxy</dt><dd>Pegasus</dd>
                    <dt>name</dt><dd>Athos</dd>
                    <dt>address</dt><dd>mfp2rt</dd>
                    <dt>sgc_designation</dt><dd>M6R-120</dd>
            </dl>''')

    def test_sg1_bratac(self):
        # test env with user name and the redirection to static file

        self.authenticate('demo', 'demo')

        res = self.url_open("/test_http/1/6")

        self.assertEqual(res.status_code, 200)
        self.assertIn('PNG', res.text)
