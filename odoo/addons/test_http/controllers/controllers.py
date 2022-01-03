# Part of Odoo. See LICENSE file for full copyright and licensing details.
import json
import werkzeug

from werkzeug.exceptions import BadRequest

from odoo import http
from odoo.http import request
from odoo.exceptions import UserError


class TestHttp(http.Controller):

    # =====================================================
    # Greeting
    # =====================================================
    @http.route(['/test_http/greeting', '/test_http/greeting-none'], type='http', auth='none')
    def greeting_none(self):
        return "Tek'ma'te"

    @http.route('/test_http/greeting-public', type='http', auth='public')
    def greeting_public(self):
        assert request.env.user, "ORM should be initialized"
        return "Tek'ma'te"

    @http.route('/test_http/greeting-user', type='http', auth='user')
    def greeting_user(self):
        assert request.env.user, "ORM should be initialized"
        return "Tek'ma'te"

    # =====================================================
    # Echo-Reply
    # =====================================================
    @http.route('/test_http/echo-http-get', type='http', auth='none', methods=['GET'])
    def echo_http_get(self, **kwargs):
        return str(kwargs)

    @http.route('/test_http/echo-http-post', type='http', auth='none', methods=['POST'], csrf=False)
    def echo_http_post(self, **kwargs):
        return str(kwargs)

    @http.route('/test_http/echo-json', type='json', auth='none', methods=['POST'], csrf=False)
    def echo_json(self, **kwargs):
        charset = request.httprequest.charset
        payload = request.httprequest.get_data().decode(charset)
        return {'payload': payload and json.loads(payload), 'kwargs': kwargs}

    @http.route('/test_http/echo-json-context', type='json', auth='user', methods=['POST'], csrf=False)
    def echo_json_context(self, **kwargs):
        return request.env.context

    # =====================================================
    # Models
    # =====================================================
    @http.route('/test_http/<model("test_http.galaxy"):galaxy>', auth='public')
    def galaxy(self, galaxy):
        if not galaxy.exists():
            raise UserError('The Ancients did not settle there.')

        return http.request.render('test_http.tmpl_galaxy', {
            'galaxy': galaxy,
            'stargates': http.request.env['test_http.stargate'].search([
                ('galaxy', '=', galaxy.id)
            ]),
        })

    @http.route('/test_http/<model("test_http.galaxy"):galaxy>/<model("test_http.stargate"):gate>', auth='user')
    def stargate(self, galaxy, gate):
        if not gate.exists():
            raise UserError("The goa'uld destroyed the gate")

        return http.request.render('test_http.tmpl_stargate', {
            'gate': gate
        })

    @http.route('/test_http/1/3', auth='user')
    def exploring_sg1(self):
        assert request.env.user.login == 'admin'

        pegasus = request.env.ref('test_http.pegasus')
        athos = request.env.ref('test_http.athos')

        return werkzeug.utils.redirect(f'/test_http/{pegasus.id}/{athos.id}')

    @http.route('/test_http/1/6', auth='user')
    def exploring_bratac(self):
        assert request.env.user.login == 'demo'

        return werkzeug.utils.redirect(f'/test_http/static/src/img/48px-StargateGlyph01.png')

    # =====================================================
    # Misc
    # =====================================================
    @http.route('/test_http/redirect-double-slash', type='http', auth='none')
    def redirect_double_slash(self):
        return werkzeug.utils.redirect('/test_http//greeting')

    @http.route('/test_http/headers', type='http', auth='none')
    def headers(self):
        return request.make_response('', headers=[
            ('Content-Type', 'application/json; charset=toto')
        ])
