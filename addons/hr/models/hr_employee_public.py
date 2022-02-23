# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, tools


class HrEmployeePublic(models.Model):
    _name = "hr.employee.public"
    _inherit = ["hr.employee.base"]
    _description = 'Public Employee'
    _order = 'name'
    _auto = False
    _log_access = True # Include magic fields

    # Fields coming from hr.employee.base
    create_date = fields.Datetime(readonly=True)
    name = fields.Char(readonly=True)
    active = fields.Boolean(readonly=True)
    department_id = fields.Many2one(readonly=True)
    job_id = fields.Many2one(readonly=True)
    job_title = fields.Char(readonly=True)
    company_id = fields.Many2one(readonly=True)
    address_id = fields.Many2one(readonly=True)
    mobile_phone = fields.Char(readonly=True)
    work_phone = fields.Char(readonly=True)
    work_email = fields.Char(readonly=True)
    work_location_id = fields.Many2one(readonly=True)
    user_id = fields.Many2one(readonly=True)
    resource_id = fields.Many2one(readonly=True)
    resource_calendar_id = fields.Many2one(readonly=True)
    tz = fields.Selection(readonly=True)
    color = fields.Integer(readonly=True)
    employee_type = fields.Selection(readonly=True)

    employee_id = fields.Many2one('hr.employee', 'Employee', compute="_compute_employee_id", search="_search_employee_id", compute_sudo=True)
    # hr.employee.public specific fields
    child_ids = fields.One2many('hr.employee.public', 'parent_id', string='Direct subordinates', readonly=True)
    image_1920 = fields.Image("Image")
    image_1024 = fields.Image("Image 1024")
    image_512 = fields.Image("Image 512")
    image_256 = fields.Image("Image 256")
    image_128 = fields.Image("Image 128")
    avatar_1920 = fields.Image("Avatar")
    avatar_1024 = fields.Image("Avatar 1024")
    avatar_512 = fields.Image("Avatar 512")
    avatar_256 = fields.Image("Avatar 256")
    avatar_128 = fields.Image("Avatar 128")
    parent_id = fields.Many2one('hr.employee.public', 'Manager', readonly=True)
    coach_id = fields.Many2one('hr.employee.public', 'Coach', readonly=True)
    user_partner_id = fields.Many2one(related='user_id.partner_id', related_sudo=False, string="User's partner")

    def _search_employee_id(self, operator, value):
        return [('id', operator, value)]

    def _compute_employee_id(self):
        for employee in self:
            employee.employee_id = self.env['hr.employee'].browse(employee.id)

    @api.model
    def _get_fields(self):
        return ','.join('emp.%s' % name for name, field in self._fields.items() if field.store and field.type not in ['many2many', 'one2many', 'binary'])

    @api.model
    def _get_images(self):
        sizes = [128, 256, 512, 1024, 1920]
        return ','.join(
            ['att.image_%s AS image_%s' % (size, size) for size in sizes] + \
            ['att.image_%s AS avatar_%s' % (size, size) for size in sizes])

    def init(self):
        tools.drop_view_if_exists(self.env.cr, self._table)
        self.env.cr.execute("""CREATE or REPLACE VIEW %s as (
            SELECT
                %s,
                %s
            FROM hr_employee emp
            INNER JOIN ir_attachment att ON (att.res_id = emp.id AND att.res_model = 'hr.employee')
        )""" % (self._table, self._get_fields(), self._get_images()))
