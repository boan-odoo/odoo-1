# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, models, _
from odoo.exceptions import ValidationError


class CouponProgram(models.Model):
    _name = 'coupon.program'
    _inherit = ['coupon.program', 'website.multi.mixin']

    def _filter_programs_on_website(self, order):
        #TODO: in sale order
        return self.filtered(lambda program: not program.website_id or program.website_id.id == order.website_id.id)

    @api.model
    def _filter_programs_from_common_rules(self, order, next_order=False):
        # TODO: in sale order
        programs = self._filter_programs_on_website(order)
        return super(CouponProgram, programs)._filter_programs_from_common_rules(order, next_order)

    def _check_promo_code(self, order, coupon_code):
        # TODO: in sale order
        if self.website_id and self.website_id != order.website_id:
            return {'error': 'This promo code is not valid on this website.'}
        return super()._check_promo_code(order, coupon_code)
