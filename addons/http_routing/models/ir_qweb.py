# -*- coding: ascii -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models
from odoo.addons.http_routing.models.ir_http import slug, unslug_url


class IrQweb(models.AbstractModel):
    _inherit = "ir.qweb"

    def _prepare_environment_values(self):
        values = super()._prepare_environment_values()
        values['slug'] = slug
        values['unslug_url'] = unslug_url
        return values
