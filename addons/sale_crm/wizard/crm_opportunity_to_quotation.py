# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _
from odoo.exceptions import UserError


class Opportunity2Quotation(models.TransientModel):

    _name = 'crm.quotation.partner'
    _description = 'Create new or use existing Customer on new Quotation'
    _inherit = 'crm.partner.binding'

    @api.model
    def default_get(self, fields):
        result = super(Opportunity2Quotation, self).default_get(fields)

        active_model = self._context.get('active_model')
        if active_model != 'crm.lead':
            raise UserError(_('You can only apply this action from a lead.'))

        active_id = self._context.get('active_id')
        if 'lead_id' in fields and active_id:
            result['lead_id'] = active_id
        return result

    action = fields.Selection(string='Quotation Customer')
    lead_id = fields.Many2one('crm.lead', "Associated Lead", required=True)

    def _create_partner(self):
        """ Create partner based on action.
            :return int: created res.partner id
        """
        self.ensure_one()
        result = self.lead_id.handle_partner_assignation(action='create')
        return result.get(self.lead_id.id)
