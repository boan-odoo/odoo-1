# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from collections import defaultdict

from odoo import _, api, fields, models

class LoyaltyReward(models.Model):
    _name = 'loyalty.reward'
    _description = 'Loyalty Reward'

    def _get_discount_mode_select(self):
        symbol = self.env.company.currency_id.symbol
        return [
            ('percent', '%'),
            ('per_point', _('%s per point', symbol)),
            ('per_order', _('%s per order', symbol))
        ]

    program_id = fields.Many2one('loyalty.program', required=True, ondelete='cascade')
    currency_id = fields.Many2one(related='program_id.currency_id')
    # For security rules
    company_id = fields.Many2one(related='program_id.company_id', store=True)

    description = fields.Char(translate=True)

    reward_type = fields.Selection([
        ('product', 'Free Product'),
        ('discount', 'Discount')],
        default='discount', required=True,
        compute='_compute_from_program_type', readonly=False, store=True,
    )

    # Discount rewards
    # TODO: > 0
    discount = fields.Float('Discount')
    discount_mode = fields.Selection(selection=_get_discount_mode_select, required=True, default='percent',
        compute='_compute_from_program_type', readonly=False, store=True)
    discount_applicability = fields.Selection([
        ('order', 'Order'),
        ('cheapest', 'Cheapest Product'),
        ('specific', 'Specific Products')], default='order',
        compute='_compute_from_program_type', readonly=False, store=True,
    )
    discount_product_ids = fields.Many2many('product.product')
    discount_max_amount = fields.Monetary('Max Discount', 'currency_id')
    discount_line_product_id = fields.Many2one('product.product', copy=False, ondelete='restrict',
        help="Product used in the sales order to apply the discount. Each reward has its own product for reporting purpose")

    # Product rewards
    reward_product_id = fields.Many2one('product.product')
    # TODO: this needs to handle product tags
    multi_product = fields.Boolean(compute='_compute_is_multi_product')
    # TODO: maybe constraint > 1 if reward_type == 'product'
    reward_product_qty = fields.Integer(default=1)
    # TODO: will not work with multi_product
    reward_product_uom_id = fields.Many2one(related='reward_product_id.product_tmpl_id.uom_id')

    #TODO: constraint >= 0
    required_points = fields.Integer('Points needed', default=1,
        compute='_compute_from_program_type', readonly=False, store=True)
    point_name = fields.Char(related='program_id.portal_point_name', readonly=True)
    clear_wallet = fields.Boolean(default=False)


    @api.depends('program_id.program_type')
    def _compute_from_program_type(self):
        default_values = self.env['loyalty.program']._program_type_default_values()
        grouped_rewards = defaultdict(lambda: self.env['loyalty.reward'])
        for reward in self:
            grouped_rewards[reward.program_id.program_type] |= reward
        for program_type, rewards in grouped_rewards.items():
            if program_type in default_values:
                rewards.write(default_values[program_type][self._name])


    @api.depends('reward_product_id')
    def _compute_is_multi_product(self):
        # TODO: when product tags are merged make this function depend and work with it
        #  The goal of this for now is to be able to design multi product flows while the tags are being developed
        self.multi_product = False

    def _get_reward_products(self):
        self.ensure_one()
        if not self.multi_product:
            return self.reward_product_id
        else:
            #TODO: use product tags for a search here
            return self.env['product.product']

    def name_get(self):
        result = []
        for reward in self:
            reward_string = ""
            if reward.reward_type == 'product':
                reward_string = _('Free Product - %s', reward.reward_product_id.name)
            elif reward.reward_type == 'discount':
                if reward.discount_mode == 'percent':
                    reward_string = _('%s%% on ', reward.discount)
                elif reward.discount_mode == 'per_point':
                    reward_string = _('%s%s per point on ', reward.discount, reward.currency_id.symbol)
                elif reward.discount_mode == 'per_order':
                    reward_string = _('%s%s per order on ', reward.discount, reward.currency_id.symbol)
                if reward.discount_applicability == 'order':
                    reward_string += _('your order')
                elif reward.discount_applicability == 'cheapest':
                    reward_string += _('the cheapest product')
                elif reward.discount_applicability == 'specific':
                    if len(reward.discount_product_ids) == 1:
                        reward_string += reward.discount_product_ids.name
                    else:
                        reward_string += _('specific products')
            result.append((reward.id, reward_string))
        return result

    @api.model_create_multi
    def create(self, vals_list):
        res = super().create(vals_list)
        #Make sure we create the product that will be used for our discounts
        for reward in res:
            if reward.discount_line_product_id:
                continue
            reward.discount_line_product_id = self.env['product.product'].create(reward._get_discount_product_values())
        return res

    def write(self, vals):
        res = super().write(vals)
        #Keep the name of our discount product up to date
        for reward in self:
            reward.discount_line_product_id.write({'name': reward.display_name})
        return res

    def _get_discount_product_values(self):
        self.ensure_one()
        return {
            'name': self.display_name,
            'type': 'service',
            #TODO: these need to be false if account is installed
            # 'taxes_id': False,
            # 'supplier_taxes_id': False,
            'sale_ok': False,
            'purchase_ok': False,
            'lst_price': 0, #Keep low
        }
