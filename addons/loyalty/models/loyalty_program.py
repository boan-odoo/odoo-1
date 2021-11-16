# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import ast

from collections import defaultdict

from odoo import _, api, fields, models
from odoo.exceptions import UserError, ValidationError
from odoo.osv.expression import expression

class LoyaltyProgram(models.Model):
    _name = 'loyalty.program'
    _description = 'Loyalty Program'
    _order = 'sequence'

    name = fields.Char('Program Name', required=True, translate=True)
    active = fields.Boolean(default=True)
    sequence = fields.Integer(copy=False)
    company_id = fields.Many2one('res.company', 'Company', default=lambda self: self.env.company)
    currency_id = fields.Many2one('res.currency', 'Currency', compute='_compute_currency_id', readonly=False, store=True, required=True)

    total_order_count = fields.Integer("Total Order Count", compute="_compute_total_order_count")

    rule_ids = fields.One2many('loyalty.rule', 'program_id', 'Triggers', default=lambda self: self.env['loyalty.rule'].new())
    rule_partner_domain = fields.Char('Partner Domain')
    reward_ids = fields.One2many('loyalty.reward', 'program_id', 'Rewards', default=lambda self: self.env['loyalty.reward'].new())
    communication_plan_ids = fields.One2many('loyalty.mail', 'program_id')
    coupon_ids = fields.One2many('loyalty.card', 'program_id')
    coupon_count = fields.Integer(compute='_compute_coupon_count')

    program_type = fields.Selection([
        ('coupons', 'Coupons'),
        ('gift_card', 'Gift Card'),
        ('ewallet', 'eWallet'),
        ('loyalty', 'Loyalty Cards'),
        ('promotion', 'Promotions')], default='coupons', required=True,
    )
    # Dictates when the points can be used:
    # current: if the order gives enough points on that order, the reward may directly be claimed, points lost otherwise
    # future: if the order gives enough points on that order, a coupon is generated for a next order, points lost otherwise
    # both: points are accumulated on the coupon to claim rewards, the reward may directly be claimed
    applies_on = fields.Selection([
        ('current', 'Current order'),
        ('future', 'Future orders'),
        ('both', 'Current & Future orders')], default='current', required=True,
        compute='_compute_from_program_type', readonly=False, store=True,
    )
    trigger = fields.Selection([
        ('auto', 'Automatic'),
        ('with_code', 'Use a code')],
        compute='_compute_from_program_type', readonly=False, store=True,
    )
    code = fields.Char('Promo Code', index=True,
        compute='_compute_from_program_type', readonly=False, store=True)
    portal_visible = fields.Boolean(default=False,
        compute='_compute_from_program_type', readonly=False, store=True)
    portal_point_name = fields.Char(default='Points', translate=True)

    @api.constrains('code')
    def _constrains_code(self):
        mapped_codes = self.filtered('code').mapped('code')
        # Program code must be unique
        if len(mapped_codes) != set(mapped_codes) or self.env['loyalty.program'].search_count([('code', 'in', mapped_codes), ('id', 'not in', self.ids)]):
            raise ValidationError(_('The promo code must be unique.'))
        # Prevent coupons and programs from sharing a code
        if self.env['loyalty.card'].search_count([('code', 'in', mapped_codes), ('shared_code', '=', False)]):
            raise ValidationError(_('A coupon with the same code was found.'))

    @api.constrains('rule_ids')
    def _constrains_rule_ids(self):
        if any(not program.rule_ids for program in self):
            raise ValidationError(_('A program must have at least one trigger.'))

    @api.constrains('reward_ids')
    def _constrains_reward_ids(self):
        if any(not program.reward_ids for program in self):
            raise ValidationError(_('A program must have at least one reward.'))

    def _compute_total_order_count(self):
        self.total_order_count = 0

    @api.depends('company_id')
    def _compute_currency_id(self):
        for program in self:
            program.currency_id = program.company_id.currency_id or program.currency_id

    @api.depends('coupon_ids')
    def _compute_coupon_count(self):
        #TODO: change to read_group if coupon_ids is never used
        for program in self:
            program.coupon_count = len(program.coupon_ids)

    @api.model
    def _program_type_default_values(self):
        # All values to change when program_type changes
        return {
            'coupons': {
                'loyalty.program': {
                    'code': False,
                    'applies_on': 'current',
                    'trigger': 'with_code',
                },
                'loyalty.rule': {
                    'reward_point_amount': 0,
                },
                'loyalty.reward': {
                    'required_points': 1,
                },
            },
            'gift_card': {
                'loyalty.program': {
                    'code': False,
                    'applies_on': 'future',
                    'trigger': 'auto',
                },
                'loyalty.rule': {
                    'reward_point_amount': '1',
                    'reward_point_mode': 'money',
                },
                'loyalty.reward': {
                    'reward_type': 'discount',
                    'discount_mode': 'per_point',
                    'discount': 1,
                    'discount_applicability': 'order',
                    'required_points': 1,
                },
            },
            'ewallet': {
                'loyalty.program': {
                    'code': False,
                    'applies_on': 'future',
                    'trigger': 'auto',
                },
                'loyalty.rule': {
                    'reward_point_amount': '1',
                    'reward_point_mode': 'money',
                },
                'loyalty.reward': {
                    'reward_type': 'discount',
                    'discount_mode': 'per_point',
                    'discount': 1,
                    'discount_applicability': 'order',
                    'required_points': 1,
                },
            },
            'promotion': {
                'loyalty.program': {
                    'applies_on': 'current',
                    'trigger': 'auto',
                },
                'loyalty.rule': {
                    'reward_point_amount': 1,
                    'reward_point_mode': 'order',
                },
                'loyalty.reward': {
                    'required_points': 1,
                },
            },
            'loyalty': {
                'loyalty.program': {
                    'code': False,
                    'applies_on': 'both',
                    'trigger': 'auto',
                    'portal_visible': True,
                },
                'loyalty.rule': {
                },
                'loyalty.reward': {
                },
            },
        }

    @api.depends('program_type')
    def _compute_from_program_type(self):
        program_types_default = self._program_type_default_values()
        grouped_programs = defaultdict(lambda: self.env['loyalty.program'])
        for program in self:
            grouped_programs[program.program_type] |= program
        for program_type, programs in grouped_programs.items():
            if program_type in program_types_default:
                programs.write(program_types_default[program_type][self._name])
        # TODO: Some plans will need to change add a communication plan

    def _has_product_domain(self):
        '''
        Returns whether the program has any domain necessary to match the rule

        Since rules are added as OR, if any rule has no domain the program always applies
        '''
        self.ensure_one()
        #TODO: method might not be needed
        return not any(not rule.product_ids and\
                   not rule.product_category_id and\
                   (not rule.product_domain or rule.product_domain == '[]')\
                   for rule in self.rule_ids)


    def _get_valid_products(self, products):
        '''
        Returns a dict containing the products that match per rule of the program
        '''
        self.ensure_one()
        rule_products = dict()
        for rule in self.rule_ids:
            domain = rule._get_valid_product_domain()
            if domain:
                rule_products[rule] = products.filtered_domain(domain)
            else:
                rule_products[rule] = products
        return rule_products

    def _is_valid_partner(self, partner_id):
        self.ensure_one()
        # Allow domain on partners using dev mode
        if self.rule_partner_domain and self.rule_partner_domain != []:
            domain = ast.literal_eval(self.rule_partner_domain)
            return bool(partner_id.filtered_domain(domain))
        return True

    @api.ondelete(at_uninstall=False)
    def _unlink_except_active(self):
        if self.filtered('active'):
            raise UserError(_('You can not delete a program in active state'))

    def toggle_active(self):
        super().toggle_active()
        for program in self:
            program.reward_ids.discount_line_product_id.active = program.active
        coupons = self.filtered(lambda p: not p.active and p.promo_code_usage == 'code_needed').coupon_ids
        coupons.filtered(lambda x: x.state != 'used').write({'state': 'expired'})

    @api.model
    def get_program_templates(self):
        '''
        Returns the templates to be used for promotional programs.
        '''
        return [
            {
                'name': 'ProgramName',
                'description': 'Description',
                'default_values': {
                    'field': 'value',
                },
            },
        ]
