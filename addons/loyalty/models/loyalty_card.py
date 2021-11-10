# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from collections import defaultdict
import random
from uuid import uuid4

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

class LoyaltyCard(models.Model):
    _name = 'loyalty.card'
    _description = 'loyalty Coupon'
    _rec_name = 'code'

    # This model does not only represent coupons but also wallets and loyalty cards

    @api.model
    def _generate_code(self):
        """
        Barcode identifiable codes.
        """
        return '044' + str(uuid4())[4:-8][3:]

    # TODO: contraint unique (program_id, partner_id) ?
    program_id = fields.Many2one('loyalty.program')
    # Reserved for this partner if non-empty
    partner_id = fields.Many2one('res.partner')
    # TODO: constraint >= 0
    points = fields.Float()
    point_name = fields.Char(related='program_id.portal_point_name', readonly=True)

    code = fields.Char(default=_generate_code, required=True, readonly=True, index=True)
    shared_code = fields.Boolean(default=False,
        help='Whether this coupon has a shared code (same code as other coupons), generally used for promotions.')
    expiration_date = fields.Date()
    #TODO: May not be needed, as state is directly linked to the amount of points
    # i.e. empty or not
    state = fields.Selection([
        ('reserved', 'Pending'),
        ('new', 'Valid'),
        ('sent', 'Sent'),
        ('used', 'Used'),
        ('expired', 'Expired'),
        ('cancel', 'Cancelled')],
        required=True, default='new'
    )

    @api.constrains('code')
    def _contrains_code(self):
        # Prevent a coupon from having the same code a program
        if self.env['loyalty.program'].search_count([('code', 'in', self.filtered(lambda c: not c.shared_code).mapped('code'))]):
            raise ValidationError(_('A promotional program with the same code as one of your coupon already exists.'))

    def _send_creation_communication(self):
        """
        Sends the 'At Creation' communication plan if it exist for the given coupons.
        """
        # Ideally one per program, but multiple is supported
        create_comm_per_program = dict()
        for program in self.program_id:
            create_comm_per_program[program] = program.communication_plan_ids.filtered(lambda c: c.trigger == 'create')
        for coupon in self:
            if not create_comm_per_program[coupon.program_id] or not coupon.partner_id:
                continue
            for comm in create_comm_per_program[coupon.program_id]:
                comm.mail_template_id.send_mail(res_id=coupon.id)

    def _send_points_reach_communication(self, points_changes):
        """
        Send the 'When Reaching' communicaton plans for the given coupons.

        If a coupons passes multiple milestones we will only send the one with the highest target.
        """
        milestones_per_program = dict()
        for program in self.program_id:
            milestones_per_program[program] = program.communication_plan_ids\
                .filtered(lambda c: c.trigger == 'points_reach')\
                .sorted('points', reverse=True)
        for coupon in self:
            coupon_change = points_changes[coupon]
            # Do nothing if coupon lost points or did not change
            if not milestones_per_program[coupon.program_id] or\
                not coupon.partner_id or\
                coupon_change[0] >= coupon_change[coupon][1]:
                continue
            this_milestone = False
            for milestone in milestones_per_program:
                if coupon_change[0] < milestone.points and milestone.points <= coupon_change[1]:
                    this_milestone = milestone
                    break
            if not this_milestone:
                continue
            this_milestone.mail_template_id.send_mail(res_id=coupon.id)


    @api.model_create_multi
    def create(self, vals_list):
        res = super().create(vals_list)
        if not self.env.context.get('no_create_mail', False):
            res._send_creation_communication()
        return res

    def write(self, vals):
        if not self.env.context.get('no_point_mail', False) and 'points' in vals:
            points_before = {coupon: coupon.points for coupon in self}
        res = super().write(vals)
        if not self.env.context.get('no_point_mail', False) and 'points' in vals:
            points_changes = {coupon: (points_before[coupon], coupon.points) for coupon in self}
            self._send_points_reach_communication(points_changes)
        return res

    #TODO: unused
    def _check_coupon_code(self, order_date, partner_id, **kwards):
        """
        Checks the validity of this single coupon.
        """
        self.ensure_one()
        message = {}
        if self.state == 'used':
            message = {'error': _('This coupon has already been used (%s).', self.code)}
        elif self.state == 'reserved':
            message = {'error': _('This coupon %s exists but the origin sales order is not validated yet.', self.code)}
        elif self.state == 'cancel':
            message = {'error': _('This coupon has been cancelled (%s).', self.code)}
        elif self.state == 'expired' or (self.expiration_date and self.expiration_date < order_date):
            message = {'error': _('This coupon is expired (%s).', self.code)}
        elif not self.program_id.active:
            message = {'error': _('The coupon program for %s is in draft or closed state', self.code)}
        elif self.partner_id and self.partner_id.id != partner_id:
            message = {'error': _('Invalid partner.')}
        return message

    def init(self):
        # Code needs to be unique except if shared_code is true
        self.env.cr.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS promo_coupon_unique_code
            ON %s (code)
            WHERE shared_code is FALSE
        """ % (self._table))
