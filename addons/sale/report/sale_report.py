# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, tools


class SaleReport(models.Model):
    _name = "sale.report"
    _description = "Sales Analysis Report"
    _auto = False
    _rec_name = 'date'
    _order = 'date desc'

    @api.model
    def _get_done_states(self):
        return ['sale', 'done', 'paid']

    name = fields.Char('Order Reference', readonly=True)
    date = fields.Datetime('Order Date', readonly=True)
    product_id = fields.Many2one('product.product', 'Product Variant', readonly=True)
    product_uom = fields.Many2one('uom.uom', 'Unit of Measure', readonly=True)
    product_uom_qty = fields.Float('Qty Ordered', readonly=True)
    qty_to_deliver = fields.Float('Qty To Deliver', readonly=True)
    qty_delivered = fields.Float('Qty Delivered', readonly=True)
    qty_to_invoice = fields.Float('Qty To Invoice', readonly=True)
    qty_invoiced = fields.Float('Qty Invoiced', readonly=True)
    partner_id = fields.Many2one('res.partner', 'Customer', readonly=True)
    company_id = fields.Many2one('res.company', 'Company', readonly=True)
    user_id = fields.Many2one('res.users', 'Salesperson', readonly=True)
    price_total = fields.Float('Total', readonly=True)
    price_subtotal = fields.Float('Untaxed Total', readonly=True)
    untaxed_amount_to_invoice = fields.Float('Untaxed Amount To Invoice', readonly=True)
    untaxed_amount_invoiced = fields.Float('Untaxed Amount Invoiced', readonly=True)
    product_tmpl_id = fields.Many2one('product.template', 'Product', readonly=True)
    categ_id = fields.Many2one('product.category', 'Product Category', readonly=True)
    nbr = fields.Integer('# of Lines', readonly=True)
    pricelist_id = fields.Many2one('product.pricelist', 'Pricelist', readonly=True)
    analytic_account_id = fields.Many2one('account.analytic.account', 'Analytic Account', readonly=True)
    team_id = fields.Many2one('crm.team', 'Sales Team', readonly=True)
    country_id = fields.Many2one('res.country', 'Customer Country', readonly=True)
    industry_id = fields.Many2one('res.partner.industry', 'Customer Industry', readonly=True)
    commercial_partner_id = fields.Many2one('res.partner', 'Customer Entity', readonly=True)
    state = fields.Selection([
        ('draft', 'Draft Quotation'),
        ('sent', 'Quotation Sent'),
        ('sale', 'Sales Order'),
        ('done', 'Sales Done'),
        ('cancel', 'Cancelled'),
        ], string='Status', readonly=True)
    weight = fields.Float('Gross Weight', readonly=True)
    volume = fields.Float('Volume', readonly=True)

    discount = fields.Float('Discount %', readonly=True)
    discount_amount = fields.Float('Discount Amount', readonly=True)
    campaign_id = fields.Many2one('utm.campaign', 'Campaign', readonly=True)
    medium_id = fields.Many2one('utm.medium', 'Medium', readonly=True)
    source_id = fields.Many2one('utm.source', 'Source', readonly=True)

    order_id = fields.Many2one('sale.order', 'Order #', readonly=True)

    def _with_sale(self):
        return ""

    def _select_sale(self):
        select_ = """
            coalesce(min(l.id), -s.id) as id,
            l.product_id as product_id,
            t.uom_id as product_uom,
            CASE WHEN l.product_id IS NOT NULL THEN sum(l.product_uom_qty / u.factor * u2.factor) ELSE 0 END as product_uom_qty,
            CASE WHEN l.product_id IS NOT NULL THEN sum(l.qty_delivered / u.factor * u2.factor) ELSE 0 END as qty_delivered,
            CASE WHEN l.product_id IS NOT NULL THEN SUM((l.product_uom_qty - l.qty_delivered) / u.factor * u2.factor) ELSE 0 END as qty_to_deliver,
            CASE WHEN l.product_id IS NOT NULL THEN sum(l.qty_invoiced / u.factor * u2.factor) ELSE 0 END as qty_invoiced,
            CASE WHEN l.product_id IS NOT NULL THEN sum(l.qty_to_invoice / u.factor * u2.factor) ELSE 0 END as qty_to_invoice,
            CASE WHEN l.product_id IS NOT NULL THEN sum(l.price_total / CASE COALESCE(s.currency_rate, 0) WHEN 0 THEN 1.0 ELSE s.currency_rate END) ELSE 0 END as price_total,
            CASE WHEN l.product_id IS NOT NULL THEN sum(l.price_subtotal / CASE COALESCE(s.currency_rate, 0) WHEN 0 THEN 1.0 ELSE s.currency_rate END) ELSE 0 END as price_subtotal,
            CASE WHEN l.product_id IS NOT NULL THEN sum(l.untaxed_amount_to_invoice / CASE COALESCE(s.currency_rate, 0) WHEN 0 THEN 1.0 ELSE s.currency_rate END) ELSE 0 END as untaxed_amount_to_invoice,
            CASE WHEN l.product_id IS NOT NULL THEN sum(l.untaxed_amount_invoiced / CASE COALESCE(s.currency_rate, 0) WHEN 0 THEN 1.0 ELSE s.currency_rate END) ELSE 0 END as untaxed_amount_invoiced,
            count(*) as nbr,
            s.name as name,
            s.date_order as date,
            s.state as state,
            s.partner_id as partner_id,
            s.user_id as user_id,
            s.company_id as company_id,
            s.campaign_id as campaign_id,
            s.medium_id as medium_id,
            s.source_id as source_id,
            t.categ_id as categ_id,
            s.pricelist_id as pricelist_id,
            s.analytic_account_id as analytic_account_id,
            s.team_id as team_id,
            p.product_tmpl_id,
            partner.country_id as country_id,
            partner.industry_id as industry_id,
            partner.commercial_partner_id as commercial_partner_id,
            CASE WHEN l.product_id IS NOT NULL THEN sum(p.weight * l.product_uom_qty / u.factor * u2.factor) ELSE 0 END as weight,
            CASE WHEN l.product_id IS NOT NULL THEN sum(p.volume * l.product_uom_qty / u.factor * u2.factor) ELSE 0 END as volume,
            l.discount as discount,
            CASE WHEN l.product_id IS NOT NULL THEN sum((l.price_unit * l.product_uom_qty * l.discount / 100.0 / CASE COALESCE(s.currency_rate, 0) WHEN 0 THEN 1.0 ELSE s.currency_rate END))ELSE 0 END as discount_amount,
            s.id as order_id"""

        additional_fields_info = self._select_additional_fields()
        template = """,
            %s as %s"""
        for fname, query_info in additional_fields_info.items():
            select_ += template % (query_info, fname)

        return select_

    def _select_additional_fields(self):
        return {}

    def _from_sale(self):
        return """
            sale_order_line l
            right outer join sale_order s on (s.id=l.order_id)
            join res_partner partner on s.partner_id = partner.id
            left join product_product p on (l.product_id=p.id)
            left join product_template t on (p.product_tmpl_id=t.id)
            left join uom_uom u on (u.id=l.product_uom)
            left join uom_uom u2 on (u2.id=t.uom_id)"""

    def _where_sale(self):
        return """
            l.display_type IS NULL"""

    def _group_by_sale(self):
        return """
            l.product_id,
            l.order_id,
            t.uom_id,
            t.categ_id,
            s.name,
            s.date_order,
            s.partner_id,
            s.user_id,
            s.state,
            s.company_id,
            s.campaign_id,
            s.medium_id,
            s.source_id,
            s.pricelist_id,
            s.analytic_account_id,
            s.team_id,
            p.product_tmpl_id,
            partner.country_id,
            partner.industry_id,
            partner.commercial_partner_id,
            l.discount,
            s.id"""

    def _query(self):
        with_ = self._with_sale()
        return f"""
            {"WITH" + with_ + "(" if with_ else ""}
            SELECT {self._select_sale()}
            FROM {self._from_sale()}
            WHERE {self._where_sale()}
            GROUP BY {self._group_by_sale()}
            {")" if with_ else ""}
        """

    def init(self):
        tools.drop_view_if_exists(self.env.cr, self._table)
        self.env.cr.execute("""CREATE or REPLACE VIEW %s as (%s)""" % (self._table, self._query()))
