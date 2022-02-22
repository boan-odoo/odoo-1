# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import _, api, fields, models
from odoo.exceptions import UserError


class PickingType(models.Model):
    _inherit = 'stock.picking.type'

    repair_returns = fields.Boolean(
        'Create Repair Orders from Returns',
        compute='_compute_repair_returns', store=True, readonly=False,
        help="If ticked, you will be able to directly create repair orders from a return.")
    is_return_type = fields.Boolean(
        "Technical field to identify default return picking type for a warehouse.", store=True,
        compute='_compute_repair_returns')

    @api.depends('warehouse_id.return_type_id')
    def _compute_repair_returns(self):
        self.is_return_type = False
        for picking_type in self:
            picking_type.is_return_type = picking_type == picking_type.warehouse_id.return_type_id
            if not picking_type.is_return_type:
                picking_type.repair_returns = False


class Picking(models.Model):
    _inherit = 'stock.picking'

    is_repairable = fields.Boolean(related='picking_type_id.repair_returns')
    repair_ids = fields.One2many('repair.order', 'picking_id')
    nbr_repairs = fields.Integer('Number of repairs linked to this picking', compute='_compute_nbr_repairs')

    @api.depends('repair_ids')
    def _compute_nbr_repairs(self):
        for picking in self:
            picking.nbr_repairs = len(picking.repair_ids)

    def action_repair_return(self):
        self.ensure_one()
        if len(self.move_ids) == 0:
            raise UserError(_("There are no products to repair in this picking."))
        return {
            'name': _('Create Repair Order'),
            'view_mode': 'form',
            'res_model': 'repair.return',
            'views': [(self.env.ref('repair.repair_repair_return_form').id, 'form')],
            'type': 'ir.actions.act_window',
            'context': {'default_picking_id': self.id},
            'target': 'new',
        }

    def action_view_repairs(self):
        if self.repair_ids:
            action = {
                'res_model': 'repair.order',
                'type': 'ir.actions.act_window',
            }
            if len(self.repair_ids) == 1:
                action.update({
                    'view_mode': 'form',
                    'res_id': self.repair_ids[0].id,
                })
            else:
                action.update({
                    'name': _('Repair Orders'),
                    'view_mode': 'tree,form',
                    'domain': [('id', 'in', self.repair_ids.ids)],
                })
            return action
