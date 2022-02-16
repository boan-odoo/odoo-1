# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.


from odoo import models, fields


class EtaActivityType(models.Model):
    _name = 'l10n_eg_edi.activity.type'
    _description = 'ETA code for activity type'

    name = fields.Char(required=True, translate=True)
    code = fields.Char(required=True)
