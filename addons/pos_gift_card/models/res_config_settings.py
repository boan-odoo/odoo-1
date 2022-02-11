# -*- coding: utf-8 -*-

from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    pos_gift_card_product_id = fields.Many2one(related='pos_config_id.gift_card_product_id', readonly=False)
    pos_gift_card_settings = fields.Selection(related='pos_config_id.gift_card_settings', readonly=False)
