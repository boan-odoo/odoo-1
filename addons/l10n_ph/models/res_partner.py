import re

from odoo import _, api, models
from odoo.exceptions import UserError


class ResPartner(models.Model):
    _inherit = "res.partner"

    @api.constrains("vat", "country_id")
    def _constrains_vat(self):
        for record in self:
            if not record.vat or record.country_id.id != self.env.ref("base.ph").id:
                return
            if len(record.vat) != 17:
                raise UserError(_("Tax ID for PH contacts must be 17 characters long! (NNN-NNN-NNN-NNNNN)"))
            r = re.compile(r"\d{3}-\d{3}-\d{3}-\d{5}")
            if r.match(record.vat) is None:
                raise UserError(_("Tax ID for PH contacts must follow the following numeric format: NNN-NNN-NNN-NNNNN"))
