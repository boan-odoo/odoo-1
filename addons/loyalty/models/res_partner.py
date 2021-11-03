# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models

class ResPartner(models.Model):
    _inherit = 'res.partner'

    # TODO: one2many on coupons? may be nice for /my/loyalty
