# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _


class BaseLanguageInstall(models.TransientModel):
    _name = "base.language.install"
    _description = "Install Language"

    @api.model
    def _default_lang_ids(self):
        """ Display the selected language when using the 'Update Terms' action
            from the language list view
        """
        if self._context.get('active_model') == 'res.lang':
            return self.env['res.lang'].browse(self._context.get('active_ids') or [self._context.get('active_id')])
        return False
    # add a context on the field itself, to be sure even inactive langs are displayed
    lang_ids = fields.Many2many('res.lang', 'res_lang_install_rel', 'language_wizard_id', 'lang_id', 'Languages', default=_default_lang_ids, context={'active_test': False})
    overwrite = fields.Boolean('Overwrite Existing Terms',
                               default=True,
                               help="If you check this box, your customized translations will be overwritten and replaced by the official ones.")

    def lang_install(self):
        self.ensure_one()
        mods = self.env['ir.module.module'].search([('state', '=', 'installed')])
        lang_ids = self.with_context(active_test=False).lang_ids
        lang_ids.active = True
        mods._update_translations(lang_ids.mapped('code'), self.overwrite)
        self.env.cr.execute('ANALYZE ir_translation')

        message = _("The languages that you selected have been successfully installed. Users can choose their favorite language in their preferences.")
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'context': dict(self._context, active_ids=self.ids),
            'target': 'new',
            'params': {
                'message': message,
                'type': 'success',
                'sticky': False,
                'next': {'type': 'ir.actions.act_window_close'},
            }
        }
