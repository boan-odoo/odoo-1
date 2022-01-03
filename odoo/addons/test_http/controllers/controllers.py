# Part of Odoo. See LICENSE file for full copyright and licensing details.
from odoo import http
from odoo.http import request
from werkzeug.exceptions import BadRequest


class TestHttp(http.Controller):

    # =====================================================
    # Greeting
    # =====================================================
    @http.route(['/test_http/greeting', '/test_http/greeting-none'], type='http', auth='none')
    def greeting_none(self):
        return "Hello"

    @http.route('/test_http/greeting-public', type='http', auth='public')
    def greeting_public(self):
        assert self.env.user, "ORM should be initialized"
        return "Hello"

    @http.route('/test_http/greeting-user', type='http', auth='user')
    def greeting_user(self):
        assert self.env.user, "ORM should be initialized"
        return "Hello"

    # =====================================================
    # Echo-Reply
    # =====================================================
    @http.route('/test_http/echo-http', type='http', auth='none')
    def echo_http(self):
        return str(request.params)

    @http.route('/test_http/echo-json', type='json', auth='none')
    def echo_json(self):
        return request.params

    @http.route('/test_http/echo-json-context', type='json', auth='user')
    def echo_json_context(self):
        return request.env.context

    @http.route('/test_http/echo-json-over-http', type='http', auth='none')
    def echo_json_over_http(self):
        if request.type != 'json':
            raise BadRequest('This endpoint requires JSON data')

        charset = request.httprequest.charset
        payload = request.httprequest.get_data().decode(charset)
        echo = json.dumps(json.loads(payload))

        return request.make_response(echo, headers=[
            ('Content-Type', 'application/json; charset=utf-8')
        ])

    # =====================================================
    # Models
    # =====================================================
    @http.route('/test_http/<model("test_http.galaxy"):galaxy>', auth='public')
    def galaxy(self, galaxy):
        return http.request.render('test_http.tmpl_galaxy', {
            'galaxy': galaxy,
            'stargates': http.request.env['test_http.stargate'].search([
                ('galaxy', '=', galaxy.id)
            ]),
        })

    @http.route('/test_http/<model("test_http.galaxy"):galaxy>/<model("test_http.stargate"):gate>', auth='user')
    def stargate(self, galaxy, gate):
        return http.request.render('test_http.tmpl_stargate', {
            'gate': gate
        })

    # =====================================================
    # Misc
    # =====================================================
    @http.route('/test_http/redirect-double-slash', type='http')
    def redirect_double_slash(self):
        return werkzeug.utils.redirect('/test_http//greeting')
