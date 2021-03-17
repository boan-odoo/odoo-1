# Part of Odoo. See LICENSE file for full copyright and licensing details.

import math
import pytz

from datetime import datetime, time, timedelta
from textwrap import dedent

from odoo import api, fields, models
from odoo.osv import expression
from odoo.tools import float_round

from odoo.addons.base.models.res_partner import _tz_get


WEEKDAY_TO_NAME = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
CRON_DEPENDS = {'name', 'active', 'send_by', 'automatic_email_time', 'moment', 'tz'}

def float_to_time(hours, moment='am', tz=None):
    """ Convert a number of hours into a time object. """
    if hours == 12.0 and moment == 'pm':
        return time.max
    fractional, integral = math.modf(hours)
    if moment == 'pm':
        integral += 12
    res = time(int(integral), int(float_round(60 * fractional, precision_digits=0)), 0)
    if tz:
        res = res.replace(tzinfo=pytz.timezone(tz))
    return res

def time_to_float(t):
    return float_round(t.hour + t.minute/60 + t.second/3600, precision_digits=2)

class LunchSupplier(models.Model):
    _name = 'lunch.supplier'
    _description = 'Lunch Supplier'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    partner_id = fields.Many2one('res.partner', string='Vendor', required=True)

    name = fields.Char('Name', related='partner_id.name', readonly=False)

    email = fields.Char(related='partner_id.email', readonly=False)
    email_formatted = fields.Char(related='partner_id.email_formatted', readonly=True)
    phone = fields.Char(related='partner_id.phone', readonly=False)
    street = fields.Char(related='partner_id.street', readonly=False)
    street2 = fields.Char(related='partner_id.street2', readonly=False)
    zip_code = fields.Char(related='partner_id.zip', readonly=False)
    city = fields.Char(related='partner_id.city', readonly=False)
    state_id = fields.Many2one("res.country.state", related='partner_id.state_id', readonly=False)
    country_id = fields.Many2one('res.country', related='partner_id.country_id', readonly=False)
    company_id = fields.Many2one('res.company', related='partner_id.company_id', readonly=False, store=True)

    responsible_id = fields.Many2one('res.users', string="Responsible", domain=lambda self: [('groups_id', 'in', self.env.ref('lunch.group_lunch_manager').id)],
                                     default=lambda self: self.env.user,
                                     help="The responsible is the person that will order lunch for everyone. It will be used as the 'from' when sending the automatic email.")

    send_by = fields.Selection([
        ('phone', 'Phone'),
        ('mail', 'Email'),
    ], 'Send Order By', default='phone')
    automatic_email_time = fields.Float('Order Time', default=12.0, required=True)
    cron_id = fields.Many2one('ir.cron', ondelete='cascade', required=True, readonly=True)

    recurrency_monday = fields.Boolean('Monday', default=True)
    recurrency_tuesday = fields.Boolean('Tuesday', default=True)
    recurrency_wednesday = fields.Boolean('Wednesday', default=True)
    recurrency_thursday = fields.Boolean('Thursday', default=True)
    recurrency_friday = fields.Boolean('Friday', default=True)
    recurrency_saturday = fields.Boolean('Saturday')
    recurrency_sunday = fields.Boolean('Sunday')

    recurrency_end_date = fields.Date('Until', help="This field is used in order to ")

    available_location_ids = fields.Many2many('lunch.location', string='Location')
    available_today = fields.Boolean('This is True when if the supplier is available today',
                                     compute='_compute_available_today', search='_search_available_today')

    tz = fields.Selection(_tz_get, string='Timezone', required=True, default=lambda self: self.env.user.tz or 'UTC')

    active = fields.Boolean(default=True)

    moment = fields.Selection([
        ('am', 'AM'),
        ('pm', 'PM'),
    ], default='am', required=True)

    delivery = fields.Selection([
        ('delivery', 'Delivery'),
        ('no_delivery', 'No Delivery')
    ], default='no_delivery')

    _sql_constraints = [
        ('automatic_email_time_range',
         'CHECK(automatic_email_time >= 0 AND automatic_email_time <= 12)',
         'Automatic Email Sending Time should be between 0 and 12'),
    ]

    def name_get(self):
        res = []
        for supplier in self:
            if supplier.phone:
                res.append((supplier.id, '%s %s' % (supplier.name, supplier.phone)))
            else:
                res.append((supplier.id, supplier.name))
        return res

    def _sync_cron(self):
        for supplier in self:
            supplier = supplier.with_context(tz=supplier.tz)

            sendat_tz = pytz.timezone(supplier.tz).localize(datetime.combine(
                fields.Date.context_today(supplier),
                float_to_time(supplier.automatic_email_time, supplier.moment)))
            lc = supplier.cron_id.lastcall
            if ((
                lc and sendat_tz.date() <= fields.Datetime.context_timestamp(supplier, lc).date()
            ) or (
                not lc and sendat_tz <= fields.Datetime.context_timestamp(supplier, fields.Datetime.now())
            )):
                sendat_tz += timedelta(days=1)
            sendat_utc = sendat_tz.astimezone(pytz.UTC).replace(tzinfo=None)

            supplier.cron_id.active = supplier.active and supplier.send_by == 'mail'
            supplier.cron_id.name = f"Lunch: send automatic email to {supplier.name}"
            supplier.cron_id.nextcall = sendat_utc
            supplier.cron_id.code = dedent(f"""\
                # This cron is dynamically controlled by {self._description}.
                # Do NOT modify this cron, modify the related record instead.
                env['{self._name}'].browse([{supplier.id}])._send_auto_email()""")

    @api.model_create_multi
    def create(self, vals_list):
        crons = self.env['ir.cron'].sudo().create([
            {
                'user_id': self.env.ref('base.user_root').id,
                'active': False,
                'interval_type': 'days',
                'interval_number': 1,
                'numbercall': -1,
                'doall': False,
                'name': "Lunch: send automatic email",
                'model_id': self.env['ir.model']._get_id(self._name),
                'state': 'code',
                'code': "",
            }
            for _ in range(len(vals_list))
        ])
        for vals, cron in zip(vals_list, crons):
            vals['cron_id'] = cron.id

        suppliers = super().create(vals_list)
        suppliers._sync_cron()
        return suppliers

    def write(self, values):
        super().write(values)
        if not CRON_DEPENDS.isdisjoint(values):
            self._sync_cron()

    def unlink(self):
        crons = self.cron_id
        super().unlink()
        crons.unlink()

    def _send_auto_email(self):
        """ Send an email to the supplier with the order of the day """
        # Called daily by cron
        self.ensure_one()

        if not self.available_today:
            return

        if self.send_by != 'mail':
            raise ValueError("Cannot send an email to this supplier")

        orders = self.env['lunch.order'].search([
            ('supplier_id', '=', self.id),
            ('state', '=', 'ordered'),
            ('date', '=', fields.Date.context_today(self.with_context(tz=self.tz))),
        ])
        if not orders:
            return

        order = {
            'company_name': orders[0].company_id.name,
            'currency_id': orders[0].currency_id.id,
            'supplier_id': self.partner_id.id,
            'supplier_name': self.name,
            'email_from': self.responsible_id.email_formatted,
            'amount_total': sum(order.price for order in orders),
        }

        email_orders = [{
            'product': order.product_id.name,
            'note': order.note,
            'quantity': order.quantity,
            'price': order.price,
            'toppings': order.display_toppings,
            'username': order.user_id.name,
        } for order in orders]

        self.env.ref('lunch.lunch_order_mail_supplier').with_context(
            order=order, lines=email_orders
        ).send_mail(self.id)

        orders.action_confirm()

    @api.depends('recurrency_end_date', 'recurrency_monday', 'recurrency_tuesday',
                 'recurrency_wednesday', 'recurrency_thursday', 'recurrency_friday',
                 'recurrency_saturday', 'recurrency_sunday')
    def _compute_available_today(self):
        now = fields.Datetime.now().replace(tzinfo=pytz.UTC)

        for supplier in self:
            now = now.astimezone(pytz.timezone(supplier.tz))

            if supplier.recurrency_end_date and now.date() >= supplier.recurrency_end_date:
                supplier.available_today = False
            else:
                fieldname = 'recurrency_%s' % (WEEKDAY_TO_NAME[now.weekday()])
                supplier.available_today = supplier[fieldname]

    def _search_available_today(self, operator, value):
        if (not operator in ['=', '!=']) or (not value in [True, False]):
            return []

        searching_for_true = (operator == '=' and value) or (operator == '!=' and not value)

        now = fields.Datetime.now().replace(tzinfo=pytz.UTC).astimezone(pytz.timezone(self.env.user.tz or 'UTC'))
        fieldname = 'recurrency_%s' % (WEEKDAY_TO_NAME[now.weekday()])

        recurrency_domain = expression.OR([
            [('recurrency_end_date', '=', False)],
            [('recurrency_end_date', '>' if searching_for_true else '<', now)]
        ])

        return expression.AND([
            recurrency_domain,
            [(fieldname, operator, value)]
        ])
