# -*- coding: utf-8 -*-

from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    def _get_floors_domain(self):
        return ['|', ('pos_config_id', 'in', self.pos_config_id.ids), ('pos_config_id', '=', False)]

    pos_floor_ids = fields.One2many(related='pos_config_id.floor_ids', readonly=False, domain=lambda self: self._get_floors_domain())
    pos_iface_orderline_notes = fields.Boolean(related='pos_config_id.iface_orderline_notes', readonly=False)
    pos_iface_printbill = fields.Boolean(related='pos_config_id.iface_printbill', readonly=False)
    pos_iface_splitbill = fields.Boolean(related='pos_config_id.iface_splitbill', readonly=False)
    pos_is_order_printer = fields.Boolean(related='pos_config_id.is_order_printer', readonly=False)
    pos_is_table_management = fields.Boolean(related='pos_config_id.is_table_management', readonly=False)
    pos_printer_ids = fields.Many2many(related='pos_config_id.printer_ids', readonly=False)
    pos_set_tip_after_payment = fields.Boolean(related='pos_config_id.set_tip_after_payment', readonly=False)
