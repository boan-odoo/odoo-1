# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import _, api, fields, models, Command
from odoo.exceptions import UserError


class RepairReturnLine(models.TransientModel):
    _name = 'repair.return.line'
    _description = 'Return Line to Repair'

    product_id = fields.Many2one(related='move_id.product_id')
    quantity = fields.Float("Quantity", digits='Product Unit of Measure', required=True, default=0.0)
    uom_id = fields.Many2one('uom.uom', string='Unit of Measure', related='product_id.uom_id')
    lot_id = fields.Many2one('stock.lot', string="Lot/Serial Number", readonly=True)
    wizard_id = fields.Many2one('repair.return', string="Wizard")
    move_id = fields.Many2one('stock.move', "Move")


class RepairReturn(models.TransientModel):
    _name = 'repair.return'
    _description = 'Create Repair Orders for a Return'

    picking_id = fields.Many2one('stock.picking', required=True)
    company_id = fields.Many2one(related='picking_id.company_id')
    return_location_id = fields.Many2one(related='picking_id.location_dest_id')
    location_id = fields.Many2one(
        'stock.location', 'Repair Location', required=True,
        compute='_compute_return_repair_lines', readonly=False, store=True,
        domain="['|', ('company_id', '=', False), ('company_id', '=', company_id)]")
    return_repair_lines = fields.One2many(
        'repair.return.line', 'wizard_id', 'Moves',
        compute='_compute_return_repair_lines', readonly=False, store=True)
    has_lots = fields.Boolean("Return contains lots/SNs", compute='_compute_return_repair_lines', store=True)
    is_mismatch_location = fields.Boolean("Repair location doesn't match return location", compute='_compute_is_mismatch_location')
    partner_id = fields.Many2one('res.partner', 'Customer', compute='_compute_return_repair_lines', readonly=False, store=True)

    @api.depends('location_id', 'return_location_id')
    def _compute_is_mismatch_location(self):
        for wizard in self:
            wizard.is_mismatch_location = wizard.return_location_id.id != wizard.location_id.id

    @api.depends('picking_id')
    def _compute_return_repair_lines(self):
        self.has_lots = False
        for wizard in self:
            # wizard has already been initialized
            if wizard.return_repair_lines:
                continue
            wizard.partner_id = wizard.picking_id.partner_id
            wizard.location_id = wizard.picking_id.location_dest_id
            return_repair_lines = []
            for move in wizard.picking_id.move_ids:
                if not move.lot_ids:
                    return_repair_lines.append(Command.create({'move_id': move.id}))
                    continue
                if not wizard.has_lots:
                    wizard.has_lots = True
                for lot_id in move.lot_ids:
                    return_repair_lines.append(Command.create({'move_id': move.id, 'lot_id': lot_id.id}))
            wizard.return_repair_lines = return_repair_lines
            if not return_repair_lines:
                wizard.return_repair_lines = [Command.clear()]
                raise UserError(_("No products selected to repair."))

    def create_repairs(self):
        repair_vals = []
        for wizard in self:
            for line in wizard.return_repair_lines:
                if line.quantity:
                    if line.move_id.has_tracking != 'none' and not line.lot_id:
                        raise UserError(_("Lot/SN to be repaired is required for tracked products."))
                    repair_vals.append({
                        'product_id': line.product_id.id,
                        'product_qty': line.quantity,
                        'product_uom': line.uom_id.id,
                        'location_id': wizard.location_id.id,
                        'lot_id': line.lot_id.id,
                        'picking_id': wizard.picking_id.id,
                        'partner_id': wizard.partner_id and wizard.partner_id.id or False,
                    })
        if not repair_vals:
            raise UserError(_("No products selected to repair."))
        repairs = self.env['repair.order'].create(repair_vals)
        action = {
            'res_model': 'repair.order',
            'type': 'ir.actions.act_window',
        }
        if len(repairs) == 1:
            action.update({
                'view_mode': 'form',
                'res_id': repairs[0].id,
            })
        else:
            action.update({
                'name': _('Repair Orders'),
                'view_mode': 'tree,form',
                'domain': [('id', 'in', repairs.ids)],
            })
        return action
