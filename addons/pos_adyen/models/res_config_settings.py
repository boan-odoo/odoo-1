# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    # pos.config fields
    pos_adyen_ask_customer_for_tip = fields.Boolean(related='pos_config_id.adyen_ask_customer_for_tip', readonly=False)
