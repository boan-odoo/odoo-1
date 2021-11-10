# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models


class IrUiMenu(models.Model):
    _inherit = 'ir.ui.menu'

    def _load_menus_blacklist(self):
        res = super()._load_menus_blacklist()
        if self.env.user.has_group('project.group_project_stages'):
            res.append(self.env.ref('project.menu_projects').id)
        if self.user_has_groups('project.group_project_user, !project.group_project_manager'):
            res.append(self.env.ref('project.rating_rating_menu_project').id)
        return res
