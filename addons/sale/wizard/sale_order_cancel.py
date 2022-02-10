# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import _, api, fields, models, tools
from odoo.exceptions import UserError


class SaleOrderCancel(models.TransientModel):
    _name = 'sale.order.cancel'
    _inherit = 'mail.composer.mixin'
    _description = 'Sales Order Cancel'

    @api.model
    def _get_default_from(self):
        if self.env.user.email:
            return tools.formataddr((self.env.user.name, self.env.user.email))
        raise UserError(_("Unable to post message, please configure the sender's email address."))

    @api.model
    def _get_default_author(self):
        return self.env.user.partner_id

    # origin
    email_from = fields.Char(string='From', default=_get_default_from)
    author_id = fields.Many2one(
        'res.partner', string='Author', index=True, ondelete='set null', default=_get_default_author
    )

    # recipients
    partner_ids = fields.Many2many(
        'res.partner', string='Recipients', compute='_compute_partner_ids'
    )
    order_id = fields.Many2one('sale.order', string='Sale Order', required=True, ondelete='cascade')
    display_invoice_alert = fields.Boolean(
        'Invoice Alert', compute='_compute_display_invoice_alert'
    )

    @api.depends('order_id')
    def _compute_partner_ids(self):
        for order in self:
            order.partner_ids += order.order_id.partner_id \
                                 + order.order_id.message_partner_ids \
                                 - order.author_id

    @api.depends('order_id')
    def _compute_display_invoice_alert(self):
        for order in self:
            order.display_invoice_alert = bool(
                order.order_id.invoice_ids.filtered(lambda inv: inv.state == 'draft')
            )

    @api.depends('order_id')
    def _compute_subject(self):
        for order in self.filtered('order_id'):
            if order.template_id:
                order.subject = self.sudo()._render_template(
                    order.template_id.subject,
                    'sale.order',
                    [order.order_id.id],
                    post_process=True,
                )[order.order_id.id]

    @api.depends('order_id')
    def _compute_body(self):
        for order in self:
            if order.template_id:
                order.body = self.sudo()._render_template(
                    order.template_id.body_html,
                    'sale.order', [order.order_id.id],
                    post_process=True,
                    engine='qweb',
                )[order.order_id.id]

    def action_send_mail_and_cancel(self):
        for order in self:
            order.order_id.message_post(
                subject=order.subject,
                body=order.body,
                message_type='comment',
                email_from=self.author_id.email,
                email_layout_xmlid='mail.mail_notification_light',
                partner_ids=self.partner_ids.ids,
            )
        return self.action_cancel()

    def action_cancel(self):
        return self.order_id.with_context({'disable_cancel_warning': True}).action_cancel()
