# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models


class AccountMove(models.Model):
    _inherit = 'account.journal'

    def _compute_restrict_mode_hash_table(self):
        super()._compute_restrict_mode_hash_table()
        for journal in self:
            if journal.company_id.country_id.code == 'PT':
                journal.restrict_mode_hash_table = True
                journal.write({'restrict_mode_hash_table': True})
