# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models
from odoo.osv.expression import OR

class PosSession(models.Model):
    _inherit = 'pos.session'

    def _pos_ui_models_to_load(self):
        result = super()._pos_ui_models_to_load()
        if self.config_id.all_program_ids:
            result.append('loyalty.program')
            result.append('loyalty.rule')
            result.append('loyalty.reward')
        return result

    def _loader_params_loyalty_program(self):
        return {
            'search_params': {
                'domain': [('id', 'in', self.config_id.all_program_ids.ids), ('active', '=', True)],
                'fields': ['name', 'trigger', 'applies_on', 'program_type', 'date_to', 'limit_usage', 'max_usage', 'is_nominative'],
            },
        }

    def _loader_params_loyalty_rule(self):
        return {
            'search_params': {
                'domain': [('program_id', 'in', self.config_id.all_program_ids.ids)],
                'fields': ['program_id', 'valid_product_ids', 'any_product', 'currency_id',
                    'reward_point_amount', 'reward_point_split', 'reward_point_mode',
                    'minimum_qty', 'minimum_amount', 'minimum_amount_tax_mode', 'mode', 'code'],
            }
        }

    def _loader_params_loyalty_reward(self):
        return {
            'search_params': {
                'domain': [('program_id', 'in', self.config_id.all_program_ids.ids)],
                'fields': ['description', 'program_id', 'reward_type', 'required_points', 'clear_wallet', 'currency_id',
                    'discount', 'discount_mode', 'discount_applicability', 'all_discount_product_ids',
                    'discount_max_amount', 'discount_line_product_id',
                    'multi_product', 'reward_product_ids', 'reward_product_qty', 'reward_product_uom_id'],
            }
        }

    def _get_pos_ui_loyalty_program(self, params):
        return self.env['loyalty.program'].search_read(**params['search_params'])

    def _get_pos_ui_loyalty_rule(self, params):
        return self.env['loyalty.rule'].search_read(**params['search_params'])

    def _get_pos_ui_loyalty_reward(self, params):
        return self.env['loyalty.reward'].search_read(**params['search_params'])

    def _loader_params_product_product(self):
        result = super(PosSession, self)._loader_params_product_product()
        config = self.config_id
        if config.all_program_ids:
            programs = config.all_program_ids
            rewards = programs.reward_ids
            products = programs.rule_ids.valid_product_ids | rewards.discount_line_product_id |\
                rewards.all_discount_product_ids | rewards.reward_product_ids
            result['search_params']['domain'] = OR([result['search_params']['domain'], [('id', 'in', products.ids)]])
        return result
