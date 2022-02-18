from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

class AccountMoveLine(models.Model):
    _inherit = 'account.move.line'

    l10n_tr_exception_code_id = fields.Many2one(comodel_name='l10n_tr.exception_reason')
    l10n_tr_exception_code_domain_ids = fields.Many2many(comodel_name='l10n_tr.exception_reason', store=True,
                                                         compute='_compute_l10n_tr_exception_code_domain_ids')

    @api.depends('tax_ids')
    def _compute_l10n_tr_exception_code_domain_ids(self):
        for line in self:
            line.l10n_tr_exception_code_domain_ids = line.tax_ids.mapped('l10n_tr_exception_code_ids')

    @api.constrains('tax_ids')
    def _check_tax_compatibility(self):
        for line in self.filtered_domain([('move_id.country_code', '=', 'TR')]):
            if len(line.mapped('tax_ids.tax_group_id')) < len(line.tax_ids):
                raise ValidationError(_(
                    'You cannot have more than one tax from each tax group in a line. '
                    'Please check the taxes on %s') % line.name)
