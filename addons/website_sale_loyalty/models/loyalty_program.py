# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models

class LoyaltyProgram(models.Model):
    _name = 'loyalty.program'
    _inherit = ['loyalty.program', 'website.multi.mixin']

    # @api.constrains('code', 'website_id')
    # def _constrains_code(self):
    #     #Programs with the same code are allowed to coexist as long
    #     # as they are not both accessible from a website.
    #     with_code = self.filtered('code')
    #     mapped_codes = with_code.mapped('code')
    #     read_result = self.env['loyalty.program'].search_read(
    #         [('website_id', 'in', [False] + [w.id for w in self.website_id]),
    #         ('code', 'in', mapped_codes),
    #         ('id', 'not in', with_code.ids)],
    #         fields=['code', 'website_id']) + [{'code': p.code, 'website_id': p.website_id} for p in with_code]
    #     existing_codes = set()
    #     for res in read_result:
    #         website_checks = (res['website_id'], False) if res['website_id'] else (False,)
    #         for website in website_checks:
    #             val = (res['code'], website)
    #             if val in existing_codes:
    #                 raise ValidationError(_('The promo code must be unique.'))
    #             existing_codes.add(val)
    #     # Prevent coupons and programs from sharing a code
    #     if self.env['loyalty.card'].search_count([('code', 'in', mapped_codes), ('shared_code', '=', False)]):
    #         raise ValidationError(_('A coupon with the same code was found.'))

    def action_program_share(self):
        self.ensure_one()
        return self.env['coupon.share'].create_share_action(program=self)
