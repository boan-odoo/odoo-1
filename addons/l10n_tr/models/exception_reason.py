from odoo import api, fields, models


class ExceptionReason(models.Model):
    _name = 'l10n_tr.exception_reason'
    _description = 'Tax exemption/withdrawal reason'

    name = fields.Char()
    code = fields.Char(size=3)
    display_name = fields.Char(compute='_compute_display_name')

    @api.depends('code', 'name')
    def _compute_display_name(self):
        for reason in self:
            reason.display_name = "%s - %s" % (reason.code, reason.name)

    @api.depends('code', 'name')
    def name_get(self):
        return [(reason.id, "%s - %s" % (reason.code, reason.name)) for reason in self]
