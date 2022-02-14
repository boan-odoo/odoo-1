# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models, tools


class EventSaleReport(models.Model):
    _name = 'event.sale.report'
    _description = 'Event Sales Report'
    _auto = False
    _rec_name = 'sale_order_line_id'

    event_type_id = fields.Many2one('event.type', string='Event Type', readonly=True)
    event_id = fields.Many2one('event.event', string='Event', readonly=True)
    event_date_begin = fields.Date(string='Event Start Date', readonly=True)
    event_date_end = fields.Date(string='Event End Date', readonly=True)
    event_ticket_id = fields.Many2one('event.event.ticket', string='Event Ticket', readonly=True)
    event_ticket_price = fields.Float(string='Ticket price', readonly=True)
    event_registration_state = fields.Selection([
        ('draft', 'Unconfirmed'), ('cancel', 'Cancelled'),
        ('open', 'Confirmed'), ('done', 'Attended')],
        string='Registration Status', readonly=True)
    is_paid = fields.Boolean('Is Paid', readonly=True)
    so_partner_id = fields.Many2one('res.partner', string='Customer', readonly=True)
    reg_partner_id = fields.Many2one('res.partner', string='Attendee', readonly=True)
    payment_status = fields.Selection(string="Payment Status", selection=[
            ('to_pay', 'Not Paid'),
            ('paid', 'Paid'),
            ('free', 'Free'),
        ])
    product_id = fields.Many2one('product.product', string='Product', readonly=True)
    sale_order_id = fields.Many2one('sale.order', readonly=True)
    sale_order_line_id = fields.Many2one('sale.order.line', readonly=True)
    sale_order_state = fields.Selection([
        ('draft', 'Quotation'),
        ('sent', 'Quotation Sent'),
        ('sale', 'Sales Order'),
        ('done', 'Locked'),
        ('cancel', 'Cancelled'),
        ], string='Sale Order Status', readonly=True)
    sale_price_total = fields.Float('Total Revenues', readonly=True)
    sale_price_subtotal = fields.Float('Untaxed Total Revenues', readonly=True)

    company_id = fields.Many2one('res.company', string='Company', readonly=True)

    def init(self):
        tools.drop_view_if_exists(self._cr, self._table)
        self._cr.execute('CREATE OR REPLACE VIEW %s AS (%s);' % (self._table, self._query()))

    def _query(self, with_=None, select=None, join=None, group_by=None):
        return "\n".join([
            self._with_clause(*(with_ or [])),
            self._select_clause(*(select or [])),
            self._from_clause(*(join or [])),
            self._group_by_clause(*(group_by or []))
        ])

    def _with_clause(self, *with_):
        # Expects strings formatted like `cte1 as (SELECT ...)`, `cte2 as (SELECT ...)`...
        if not with_:
            return ''
        return """
WITH 
    """ + ',\n    '.join(with_)

    def _select_clause(self, *select):
        return """
SELECT
    ROW_NUMBER() OVER (ORDER BY event_registration.id) AS id,
    
    event_registration.state AS event_registration_state, 
    event_registration.event_id AS event_id,
    event_registration.event_ticket_id AS event_ticket_id,
    event_registration.partner_id as reg_partner_id,
    event_registration.sale_order_id as sale_order_id,
    event_registration.sale_order_line_id as sale_order_line_id,
    event_registration.is_paid as is_paid,
    
    event_event.event_type_id AS event_type_id,
    event_event.date_begin AS event_date_begin,
    event_event.date_end AS event_date_end,

    event_event_ticket.price as event_ticket_price,

    sale_order.state AS sale_order_state,
    sale_order.partner_id AS so_partner_id,
    sale_order.company_id AS company_id,
    
    sale_order_line.product_id AS product_id,
    sale_order_line.price_total
        / CASE COALESCE(sale_order.currency_rate, 0) WHEN 0 THEN 1.0 ELSE sale_order.currency_rate END
        / sale_order_line.product_uom_qty AS sale_price_total,
    sale_order_line.price_subtotal
        / CASE COALESCE(sale_order.currency_rate, 0) WHEN 0 THEN 1.0 ELSE sale_order.currency_rate END
        / sale_order_line.product_uom_qty AS sale_price_subtotal,
    CASE
        WHEN sale_order_line.price_total = 0 THEN 'free'
        WHEN event_registration.is_paid THEN 'paid'
        ELSE 'to_pay'
    END payment_status%(select)s""" % {
            'select': ',\n    ' + ',\n    '.join(select) if select else '',
        }

    def _from_clause(self, *join_):
        return """
FROM event_registration
LEFT JOIN event_event ON event_event.id = event_registration.event_id
LEFT JOIN event_event_ticket ON event_event_ticket.id = event_registration.event_ticket_id
LEFT JOIN sale_order ON sale_order.id = event_registration.sale_order_id
LEFT JOIN sale_order_line ON sale_order_line.id = event_registration.sale_order_line_id %(join)s
""" % {'join': "\n".join(join_)}

    def _group_by_clause(self, *group_by):
        if not group_by:
            return ''
        return """
GROUP BY
    """ + ',\n    '.join(group_by)
