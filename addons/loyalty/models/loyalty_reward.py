# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import _, api, fields, models

class LoyaltyReward(models.Model):
    _name = 'loyalty.reward'
    _description = 'Loyalty Reward'
    _rec_name = 'description'

    def _get_discount_mode_select(self):
        symbol = self.env.context.get('currency_symbol', self.env.company.currency_id.symbol)
        return [
            ('percent', '%'),
            ('per_point', _('%s per point', symbol)),
            ('per_order', _('%s per order', symbol))
        ]

    def name_get(self):
        result = []
        for reward in self:
            result.append((reward.id, reward.program_id.name + ' - ' + reward.description))
        return result

    active = fields.Boolean(default=True)
    program_id = fields.Many2one('loyalty.program', required=True, ondelete='cascade')
    # Stored for security rules
    company_id = fields.Many2one(related='program_id.company_id', store=True)
    currency_id = fields.Many2one(related='program_id.currency_id')

    description = fields.Char(compute='_compute_description', readonly=False, store=True, translate=True)

    reward_type = fields.Selection([
        ('product', 'Free Product'),
        ('discount', 'Discount')],
        default='discount', required=True,
    )

    # Discount rewards
    discount = fields.Float('Discount', default=10)
    discount_mode = fields.Selection(selection=_get_discount_mode_select, required=True, default='percent')
    discount_applicability = fields.Selection([
        ('order', 'Order'),
        ('cheapest', 'Cheapest Product'),
        ('specific', 'Specific Products')], default='order',
    )
    discount_product_ids = fields.Many2many('product.product')
    discount_product_tag_id = fields.Many2one('product.tag')
    all_discount_product_ids = fields.Many2many('product.product', compute='_compute_all_discount_product_ids')
    discount_max_amount = fields.Monetary('Max Discount', 'currency_id')
    discount_line_product_id = fields.Many2one('product.product', copy=False, ondelete='restrict',
        help="Product used in the sales order to apply the discount. Each reward has its own product for reporting purpose")
    is_global_discount = fields.Boolean(compute='_compute_is_global_discount')

    # Product rewards
    reward_product_id = fields.Many2one('product.product', string='Product')
    reward_product_tag_id = fields.Many2one('product.tag', string='Product Tag')
    multi_product = fields.Boolean(compute='_compute_multi_product')
    reward_product_ids = fields.Many2many(
        'product.product', string="Reward Products", compute='_compute_multi_product',
        help="These are the products that can be claimed with this rule.")
    reward_product_qty = fields.Integer(default=1)
    reward_product_uom_id = fields.Many2one('uom.uom', compute='_compute_reward_product_uom_id')

    required_points = fields.Float('Points needed', default=1)
    point_name = fields.Char(related='program_id.portal_point_name', readonly=True)
    clear_wallet = fields.Boolean(default=False)

    _sql_constraints = [
        ('required_points_positive', 'CHECK (required_points > 0)',
            'The required points for a reward must be strictly positive.'),
        ('product_qty_positive', "CHECK (reward_type != 'product' OR reward_product_qty > 0)",
            'The reward product quantity must be strictly positive.'),
        ('discount_positive', "CHECK (reward_type != 'discount' OR discount > 0)",
            'The discount must be strictly positive.'),
    ]

    @api.depends('reward_product_id.product_tmpl_id.uom_id', 'reward_product_tag_id')
    def _compute_reward_product_uom_id(self):
        for reward in self:
            reward.reward_product_uom_id = reward.reward_product_ids.product_tmpl_id.uom_id[:1]

    @api.depends('discount_product_ids', 'discount_product_tag_id')
    def _compute_all_discount_product_ids(self):
        for reward in self:
            reward.all_discount_product_ids = reward.discount_product_ids | reward.discount_product_tag_id.product_ids

    @api.depends('reward_product_id', 'reward_product_tag_id', 'reward_type')
    def _compute_multi_product(self):
        for reward in self:
            products = reward.reward_product_id + reward.reward_product_tag_id.product_ids
            reward.multi_product = reward.reward_type == 'product' and len(products) > 1
            reward.reward_product_ids = reward.reward_type == 'product' and products or self.env['product.product']

    @api.depends('reward_type', 'reward_product_id', 'discount_mode',
                 'discount', 'currency_id', 'discount_applicability', 'all_discount_product_ids')
    def _compute_description(self):
        for reward in self:
            reward_string = ""
            if reward.reward_type == 'product':
                products = reward.reward_product_ids
                if len(products) == 1:
                    reward_string = _('Free Product - %s', reward.reward_product_id.name)
                else:
                    reward_string = _('Free Product - [%s]', ', '.join(products.mapped('name')))
            elif reward.reward_type == 'discount':
                if reward.discount_mode == 'percent':
                    reward_string = _('%g%% on ', reward.discount)
                elif reward.discount_mode == 'per_point':
                    reward_string = _('%g%s per point on ', reward.discount, reward.currency_id.symbol)
                elif reward.discount_mode == 'per_order':
                    reward_string = _('%g%s per order on ', reward.discount, reward.currency_id.symbol)
                if reward.discount_applicability == 'order':
                    reward_string += _('your order')
                elif reward.discount_applicability == 'cheapest':
                    reward_string += _('the cheapest product')
                elif reward.discount_applicability == 'specific':
                    if len(reward.all_discount_product_ids) == 1:
                        reward_string += reward.all_discount_product_ids.name
                    else:
                        reward_string += _('specific products')
            reward.description = reward_string

    @api.depends('reward_type', 'discount_applicability', 'discount_mode')
    def _compute_is_global_discount(self):
        for reward in self:
            reward.is_global_discount = reward.reward_type == 'discount' and\
                                        reward.discount_applicability == 'order' and\
                                        reward.discount_mode == 'percent'

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
        if 'description' in vals:
            #Keep the name of our discount product up to date
            for reward in self:
                if not reward.discount_line_product_id:
                    reward.discount_line_product_id =\
                        self.env['product.product'].create(reward._get_discount_product_values())
                reward.discount_line_product_id.write({'name': reward.description})
        return res

    def _get_discount_product_values(self):
        self.ensure_one()
        return {
            'name': self.description,
            'type': 'service',
            'sale_ok': False,
            'purchase_ok': False,
            'lst_price': 0,
        }
