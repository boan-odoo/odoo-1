# -*- coding: utf-8 -*-

from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    def _default_pos_config(self):
        # Default to the last modified pos.config.
        return self.env['pos.config'].search([('company_id', '=', self.env.company.id)], order='write_date desc', limit=1)

    pos_config_id = fields.Many2one('pos.config', string="Point of Sale", default=lambda self: self._default_pos_config())
    sale_tax_id = fields.Many2one('account.tax', string="Default Sale Tax", related='company_id.account_sale_tax_id', readonly=False)
    module_pos_mercury = fields.Boolean(string="Vantiv Payment Terminal", help="The transactions are processed by Vantiv. Set your Vantiv credentials on the related payment method.")
    module_pos_adyen = fields.Boolean(string="Adyen Payment Terminal", help="The transactions are processed by Adyen. Set your Adyen credentials on the related payment method.")
    module_pos_six = fields.Boolean(string="Six Payment Terminal", help="The transactions are processed by Six. Set the IP address of the terminal on the related payment method.")
    update_stock_quantities = fields.Selection(related="company_id.point_of_sale_update_stock_quantities", readonly=False)
    account_default_pos_receivable_account_id = fields.Many2one(string='Default Account Receivable (PoS)', related='company_id.account_default_pos_receivable_account_id', readonly=False)

    # pos.config fields
    pos_module_pos_coupon = fields.Boolean(related='pos_config_id.module_pos_coupon', readonly=False, string="Coupons & Promotions (PoS)")
    pos_module_pos_discount = fields.Boolean(related='pos_config_id.module_pos_discount', readonly=False)
    pos_module_pos_gift_card = fields.Boolean(related='pos_config_id.module_pos_gift_card', readonly=False, string="Gift Card (PoS)")
    pos_module_pos_hr = fields.Boolean(related='pos_config_id.module_pos_hr', readonly=False)
    pos_module_pos_loyalty = fields.Boolean(related='pos_config_id.module_pos_loyalty', readonly=False)
    pos_module_pos_restaurant = fields.Boolean(related='pos_config_id.module_pos_restaurant', readonly=False)

    pos_allowed_pricelist_ids = fields.Many2many(related='pos_config_id.allowed_pricelist_ids')
    pos_amount_authorized_diff = fields.Float(related='pos_config_id.amount_authorized_diff', readonly=False)
    pos_available_pricelist_ids = fields.Many2many(related='pos_config_id.available_pricelist_ids', readonly=False)
    pos_barcode_nomenclature_id = fields.Many2one(related='pos_config_id.barcode_nomenclature_id', readonly=False)
    pos_cash_control = fields.Boolean(related='pos_config_id.cash_control')
    pos_cash_rounding = fields.Boolean(related='pos_config_id.cash_rounding', readonly=False, string="Cash Rounding (PoS)")
    pos_company_has_template = fields.Boolean(related='pos_config_id.company_has_template')
    pos_default_bill_ids = fields.Many2many(related='pos_config_id.default_bill_ids', readonly=False)
    pos_default_fiscal_position_id = fields.Many2one(related='pos_config_id.default_fiscal_position_id', readonly=False)
    pos_fiscal_position_ids = fields.Many2many(related='pos_config_id.fiscal_position_ids', readonly=False)
    pos_has_active_session = fields.Boolean(related='pos_config_id.has_active_session')
    pos_iface_available_categ_ids = fields.Many2many(related='pos_config_id.iface_available_categ_ids', readonly=False)
    pos_iface_big_scrollbars = fields.Boolean(related='pos_config_id.iface_big_scrollbars', readonly=False)
    pos_iface_cashdrawer = fields.Boolean(related='pos_config_id.iface_cashdrawer', readonly=False)
    pos_iface_customer_facing_display_local = fields.Boolean(related='pos_config_id.iface_customer_facing_display_local', readonly=False)
    pos_iface_customer_facing_display_via_proxy = fields.Boolean(related='pos_config_id.iface_customer_facing_display_via_proxy', readonly=False)
    pos_iface_electronic_scale = fields.Boolean(related='pos_config_id.iface_electronic_scale', readonly=False)
    pos_iface_print_auto = fields.Boolean(related='pos_config_id.iface_print_auto', readonly=False)
    pos_iface_print_skip_screen = fields.Boolean(related='pos_config_id.iface_print_skip_screen', readonly=False)
    pos_iface_print_via_proxy = fields.Boolean(related='pos_config_id.iface_print_via_proxy', readonly=False)
    pos_iface_scan_via_proxy = fields.Boolean(related='pos_config_id.iface_scan_via_proxy', readonly=False)
    pos_iface_start_categ_id = fields.Many2one(related='pos_config_id.iface_start_categ_id', readonly=False)
    pos_iface_tax_included = fields.Selection(related='pos_config_id.iface_tax_included', readonly=False)
    pos_iface_tipproduct = fields.Boolean(related='pos_config_id.iface_tipproduct', readonly=False)
    pos_invoice_journal_id = fields.Many2one(related='pos_config_id.invoice_journal_id', readonly=False)
    pos_is_header_or_footer = fields.Boolean(related='pos_config_id.is_header_or_footer', readonly=False)
    pos_is_margins_costs_accessible_to_every_user = fields.Boolean(related='pos_config_id.is_margins_costs_accessible_to_every_user', readonly=False)
    pos_is_posbox = fields.Boolean(related='pos_config_id.is_posbox', readonly=False)
    pos_journal_id = fields.Many2one(related='pos_config_id.journal_id', readonly=False)
    pos_limit_categories = fields.Boolean(related='pos_config_id.limit_categories', readonly=False)
    pos_limited_partners_amount = fields.Integer(related='pos_config_id.limited_partners_amount', readonly=False)
    pos_limited_partners_loading = fields.Boolean(related='pos_config_id.limited_partners_loading', readonly=False)
    pos_limited_products_amount = fields.Integer(related='pos_config_id.limited_products_amount', readonly=False)
    pos_limited_products_loading = fields.Boolean(related='pos_config_id.limited_products_loading', readonly=False)
    pos_manual_discount = fields.Boolean(related='pos_config_id.manual_discount', readonly=False)
    pos_only_round_cash_method = fields.Boolean(related='pos_config_id.only_round_cash_method', readonly=False)
    pos_other_devices = fields.Boolean(related='pos_config_id.other_devices', readonly=False)
    pos_partner_load_background = fields.Boolean(related='pos_config_id.partner_load_background', readonly=False)
    pos_payment_method_ids = fields.Many2many(related='pos_config_id.payment_method_ids', readonly=False)
    pos_picking_policy = fields.Selection(related='pos_config_id.picking_policy', readonly=False)
    pos_picking_type_id = fields.Many2one(related='pos_config_id.picking_type_id', readonly=False)
    pos_pricelist_id = fields.Many2one(related='pos_config_id.pricelist_id', readonly=False)
    pos_product_load_background = fields.Boolean(related='pos_config_id.product_load_background', readonly=False)
    pos_proxy_ip = fields.Char(related='pos_config_id.proxy_ip', readonly=False)
    pos_receipt_footer = fields.Text(related='pos_config_id.receipt_footer', readonly=False)
    pos_receipt_header = fields.Text(related='pos_config_id.receipt_header', readonly=False)
    pos_restrict_price_control = fields.Boolean(related='pos_config_id.restrict_price_control', readonly=False)
    pos_rounding_method = fields.Many2one(related='pos_config_id.rounding_method', readonly=False)
    pos_route_id = fields.Many2one(related='pos_config_id.route_id', readonly=False)
    pos_selectable_categ_ids = fields.Many2many(related='pos_config_id.selectable_categ_ids')
    pos_sequence_id = fields.Many2one(related='pos_config_id.sequence_id')
    pos_set_maximum_difference = fields.Boolean(related='pos_config_id.set_maximum_difference', readonly=False)
    pos_ship_later = fields.Boolean(related='pos_config_id.ship_later', readonly=False)
    pos_start_category = fields.Boolean(related='pos_config_id.start_category', readonly=False)
    pos_tax_regime_selection = fields.Boolean(related='pos_config_id.tax_regime_selection', readonly=False)
    pos_tip_product_id = fields.Many2one(related='pos_config_id.tip_product_id', readonly=False)
    pos_use_pricelist = fields.Boolean(related='pos_config_id.use_pricelist', readonly=False)
    pos_warehouse_id = fields.Many2one(related='pos_config_id.warehouse_id', readonly=False, string="Warehouse (PoS)")

    # TODO-JCB: Review this logic.
    def set_values(self):
        if self.pos_cash_rounding and not self.group_cash_rounding:
            self.group_cash_rounding = True

        if self.pos_use_pricelist and not self.group_product_pricelist:
            self.group_product_pricelist = True

        super(ResConfigSettings, self).set_values()
        if not self.group_product_pricelist:
            self.env['pos.config'].search([
                ('use_pricelist', '=', True)
            ]).use_pricelist = False

        if not self.group_cash_rounding:
            self.env['pos.config'].search([
                ('cash_rounding', '=', True)
            ]).cash_rounding = False

    def action_pos_config_create_new(self):
        return {
            'view_mode': 'form',
            'view_id': self.env.ref('point_of_sale.pos_config_view_form').id,
            'res_model': 'pos.config',
            'type': 'ir.actions.act_window',
            'target': 'new',
            'res_id': False,
            'context': {'pos_config_open_modal': True, 'pos_config_basic': True},
        }

    def pos_open_ui(self):
        return self.pos_config_id.open_ui()
