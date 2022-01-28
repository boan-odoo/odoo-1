# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models


class SaleReport(models.Model):
    _inherit = "sale.report"

    @api.model
    def _get_done_states(self):
        done_states = super()._get_done_states()
        done_states.extend(['pos_done', 'invoiced'])
        return done_states

    state = fields.Selection(
        selection_add=[
            ('pos_draft', 'New'),
            ('paid', 'Paid'),
            ('pos_done', 'Posted'),
            ('invoiced', 'Invoiced')
        ],
    )

    def _select_pos(self):
        select_ = """
            MIN(l.id) AS id,
            l.product_id AS product_id,
            t.uom_id AS product_uom,
            sum(l.qty) AS product_uom_qty,
            sum(l.qty) AS qty_delivered,
            0 as qty_to_deliver,
            CASE WHEN pos.state = 'invoiced' THEN sum(l.qty) ELSE 0 END AS qty_invoiced,
            CASE WHEN pos.state != 'invoiced' THEN sum(l.qty) ELSE 0 END AS qty_to_invoice,
            SUM(l.price_subtotal_incl) / MIN(CASE COALESCE(pos.currency_rate, 0) WHEN 0 THEN 1.0 ELSE pos.currency_rate END) AS price_total,
            SUM(l.price_subtotal) / MIN(CASE COALESCE(pos.currency_rate, 0) WHEN 0 THEN 1.0 ELSE pos.currency_rate END) AS price_subtotal,
            (CASE WHEN pos.state != 'invoiced' THEN SUM(l.price_subtotal_incl) ELSE 0 END) / MIN(CASE COALESCE(pos.currency_rate, 0) WHEN 0 THEN 1.0 ELSE pos.currency_rate END) AS amount_to_invoice,
            (CASE WHEN pos.state = 'invoiced' THEN SUM(l.price_subtotal_incl) ELSE 0 END) / MIN(CASE COALESCE(pos.currency_rate, 0) WHEN 0 THEN 1.0 ELSE pos.currency_rate END) AS amount_invoiced,
            count(*) AS nbr,
            pos.name AS name,
            pos.date_order AS date,
            CASE WHEN pos.state = 'draft' THEN 'pos_draft' WHEN pos.state = 'done' THEN 'pos_done' else pos.state END AS state,
            pos.partner_id AS partner_id,
            pos.user_id AS user_id,
            pos.company_id AS company_id,
            NULL AS campaign_id,
            NULL AS medium_id,
            NULL AS source_id,
            t.categ_id AS categ_id,
            pos.pricelist_id AS pricelist_id,
            NULL AS analytic_account_id,
            pos.crm_team_id AS team_id,
            p.product_tmpl_id,
            partner.country_id AS country_id,
            partner.industry_id AS industry_id,
            partner.commercial_partner_id AS commercial_partner_id,
            (sum(t.weight) * l.qty / u.factor) AS weight,
            (sum(t.volume) * l.qty / u.factor) AS volume,
            l.discount as discount,
            sum((l.price_unit * l.discount * l.qty / 100.0 / CASE COALESCE(pos.currency_rate, 0) WHEN 0 THEN 1.0 ELSE pos.currency_rate END)) as discount_amount,
            NULL as order_id"""

        additional_fields_info = self._select_additional_fields()
        template = """,
            NULL as %s"""
        for fname in additional_fields_info.keys():
            select_ += template % fname
        return select_

    def _from_pos(self):
        return """
            pos_order_line l
            join pos_order pos on l.order_id = pos.id
            left join res_partner partner on (pos.partner_id=partner.id OR pos.partner_id = NULL)
            left join product_product p on l.product_id=p.id
            left join product_template t on p.product_tmpl_id=t.id
            left join uom_uom u on u.id=t.uom_id
            left join pos_session session on session.id = pos.session_id
            left join pos_config config on config.id = session.config_id"""

    def _where_pos(self):
        return """
            l.sale_order_line_id is NULL"""

    def _group_by_pos(self):
        return """
            l.order_id,
            l.product_id,
            l.price_unit,
            l.discount,
            l.qty,
            t.uom_id,
            t.categ_id,
            pos.name,
            pos.date_order,
            pos.partner_id,
            pos.user_id,
            pos.state,
            pos.company_id,
            pos.pricelist_id,
            p.product_tmpl_id,
            partner.country_id,
            partner.industry_id,
            partner.commercial_partner_id,
            u.factor,
            pos.crm_team_id"""

    def _query(self):
        res = super()._query()
        return res + f"""UNION ALL (
            SELECT {self._select_pos()}
            FROM {self._from_pos()}
            WHERE {self._where_pos()}
            GROUP BY {self._group_by_pos()}
            )
        """
