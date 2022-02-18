from odoo import fields, models


class AccountTax(models.Model):
    _inherit = "account.tax"

    l10n_tr_exception_code_ids = fields.Many2many(comodel_name='l10n_tr.exception_reason', string="Reason Code")


class AccountTaxTemplate(models.Model):
    _inherit = "account.tax.template"

    l10n_tr_exception_code_ids = fields.Many2many(comodel_name='l10n_tr.exception_reason', string="Reason Code")


class AccountTaxGroup(models.Model):
    _inherit = "account.tax.group"

    l10n_tr_code = fields.Char(string="Code", size=4)
