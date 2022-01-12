# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from . import controllers
from . import models
from . import report
from . import wizard

from odoo import api, SUPERUSER_ID

def _hr_holiday_post_init(cr, registry):
    env = api.Environment(cr, SUPERUSER_ID, {})
    country_code = env.company.country_id.code
    if country_code:
        module_ids = False

        # if the company is in France
        if country_code == 'FR':
            module_ids = env['ir.module.module'].search([('name', '=', 'l10n_fr_hr_work_entry_holidays'), ('state', '=', 'uninstalled')])
        if module_ids:
            module_ids.sudo().button_install()