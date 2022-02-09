# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError
from odoo.osv import expression


class AccountTaxReport(models.Model):
    _name = "account.tax.report"
    _description = 'Account Tax Report'
    _order = 'country_id, name'

    name = fields.Char(string="Name", required=True, help="Name of this tax report")
    country_id = fields.Many2one(string="Country", comodel_name='res.country', required=True, default=lambda x: x.env.company.country_id.id, help="Country for which this report is available.")
    line_ids = fields.One2many(string="Report Lines", comodel_name='account.tax.report.line', inverse_name='report_id', help="Content of this tax report")
    root_line_ids = fields.One2many(string="Root Report Lines", comodel_name='account.tax.report.line', inverse_name='report_id', domain=[('parent_id', '=', None)], help="Subset of line_ids, containing the lines at the root of the report.")


    def copy(self, default=None):
        # Overridden from regular copy, since the ORM does not manage
        # the copy of the lines hierarchy properly (all the parent_id fields
        # need to be reassigned to the corresponding copies).

        copy_default = {k:v for k, v in default.items() if k != 'line_ids'} if default else None
        copied_report = super(AccountTaxReport, self).copy(default=copy_default) #This copies the report without its lines

        lines_map = {} # maps original lines to their copies (using ids)
        lines_to_treat = list(self.line_ids.filtered(lambda x: not x.parent_id))
        while lines_to_treat:
            line = lines_to_treat.pop()
            lines_to_treat += list(line.children_line_ids)

            copy = line.copy({'parent_id': lines_map.get(line.parent_id.id, None), 'report_id': copied_report.id})
            lines_map[line.id] = copy.id

        return copied_report

    def get_lines_in_hierarchy(self): #TODO OCO sans doute à généraliser, et le flatten de las se chargera de liquider ça comme il faut
        """ Returns an interator to the lines of this tax report, were parent lines
        ar all directly followed by their children.
        """
        self.ensure_one()
        lines_to_treat = list(self.line_ids.filtered(lambda x: not x.parent_id).sorted(lambda x: x.sequence)) # Used as a stack, whose index 0 is the top
        while lines_to_treat:
            to_yield = lines_to_treat[0]
            lines_to_treat = list(to_yield.children_line_ids.sorted(lambda x: x.sequence)) + lines_to_treat[1:]
            yield to_yield

    def get_checks_to_perform(self, amounts, carried_over): #TODO OCO ça franchement, on en profiterait bien pour le refaire ... à voir ; on peut dans un premier temps juste généraliser
        """ To override in localizations
        If value is a float, it will be formatted with format_value
        The line is not displayed if it is falsy (0, 0.0, False, ...)
        :param amounts: the mapping dictionary between codes and values
        :param carried_over: the mapping dictionary between codes and whether they are carried over
        :return: iterable of tuple (name, value)
        """
        self.ensure_one()
        return []


class AccountTaxReportLine(models.Model):
    _name = "account.tax.report.line"
    _description = 'Account Tax Report Line'
    _order = 'sequence'
    _parent_store = True

    name = fields.Char(string="Name", required=True, help="Complete name for this report line, to be used in report.")
    report_action_id = fields.Many2one(string="Report Action", comodel_name='ir.actions.act_window', help="The optional action to call when clicking on this line in accounting reports.")
    children_line_ids = fields.One2many(string="Children Lines", comodel_name='account.tax.report.line', inverse_name='parent_id', help="Lines that should be rendered as children of this one")
    parent_id = fields.Many2one(string="Parent Line", comodel_name='account.tax.report.line')
    sequence = fields.Integer(string='Sequence', required=True,
        help="Sequence determining the order of the lines in the report (smaller ones come first). This order is applied locally per section (so, children of the same line are always rendered one after the other).")
    parent_path = fields.Char(index=True, unaccent=False)
    report_id = fields.Many2one(string="Tax Report", required=True, comodel_name='account.tax.report', ondelete='cascade', help="The parent tax report of this line")

    # helper to create tags (positive and negative) on report line creation
    tag_name = fields.Char(string="Tag Name", help="Short name for the tax grid corresponding to this report line. Leave empty if this report line should not correspond to any such grid.")

    # fields used in specific localization reports, where a report line isn't simply the given by the sum of account.move.line with selected tags
    code = fields.Char(string="Code", help="Optional unique code to refer to this line in total formulas")
    formula = fields.Char(string="Formula", help="Python expression used to compute the value of a total line. This field is mutually exclusive with tag_name, setting it turns the line to a total line. Tax report line codes can be used as variables in this expression to refer to the balance of the corresponding lines in the report. A formula cannot refer to another line using a formula.")

    # fields used to carry over amounts between periods

    # The selection should be filled in localizations using the system
    carry_over_condition_method = fields.Selection(
        selection=[
            ('no_negative_amount_carry_over_condition', 'No negative amount'),
            ('always_carry_over_and_set_to_0', 'Always carry over and set to 0'),
        ],
        string="Method",
        help="The method used to determine if this line should be carried over."
    )
    carry_over_destination_line_id = fields.Many2one(
        string="Destination",
        comodel_name="account.tax.report.line",
        domain="[('report_id', '=', report_id)]",
        help="The line to which the value of this line will be carried over to if needed."
             " If left empty the line will carry over to itself."
    )
    is_carryover_persistent = fields.Boolean(
        string="Persistent",
        help="Defines how this report line creates carry over lines when performing tax closing."
             "If true, the amounts carried over will always be added on top of each other: "
             "for example, a report line with a balance of 10 with an existing carryover of 50 "
             "will add an additional 10 to it when doing the closing, making a total carryover of 60. "
             "If false, the total carried over amount will be forced to the total of this report line: "
             "a report line with a balance of 10 with an existing carryover of 50 will create a new "
             "carryover line of -40, so that the total carryover becomes 10.",
        default=True,
    )
    is_carryover_used_in_balance = fields.Boolean(
        string="Used in line balance",
        help="If set, the carryover amount for this line will be used when calculating its balance in the report."
             "This means that the carryover could affect other lines if they are using this one in their computation."
    )

    @api.constrains('formula', 'tag_name')
    def _validate_formula(self):
        for record in self:
            if record.formula and record.tag_name:
                raise ValidationError(_("Tag name and formula are mutually exclusive, they should not be set together on the same tax report line."))

    @api.constrains('tag_name', 'tag_ids')
    def _validate_tags(self):
        for record in self.filtered(lambda x: x.tag_ids):
            neg_tags = record.tag_ids.filtered(lambda x: x.tax_negate)
            pos_tags = record.tag_ids.filtered(lambda x: not x.tax_negate)

            if (len(neg_tags) != 1 or len(pos_tags) != 1):
                raise ValidationError(_("If tags are defined for a tax report line, only two are allowed on it: a positive and a negative one."))

            if neg_tags.name != '-'+record.tag_name or pos_tags.name != '+'+record.tag_name:
                raise ValidationError(_("The tags linked to a tax report line should always match its tag name."))

    def action_view_carryover_lines(self, options):
        ''' Action when clicking on the "View carryover lines" in the carryover info popup.
        Takes into account the report options, to get the correct lines depending on the current
        company/companies.

        :return:    An action showing the account.tax.carryover.lines for the current tax report line.
        '''
        self.ensure_one()

        target = self._get_carryover_destination_line(options)
        domain = target._get_carryover_lines_domain(options)
        carryover_lines = self.env['account.tax.carryover.line'].search(domain)

        return {
            'type': 'ir.actions.act_window',
            'name': _('Carryover Lines For %s', target.name),
            'res_model': 'account.tax.carryover.line',
            'view_type': 'list',
            'view_mode': 'list',
            'views': [[self.env.ref('account.account_tax_carryover_line_tree').id, 'list'],
                      [False, 'form']],
            'domain': [('id', 'in', carryover_lines.ids)],
        }

    def _get_carryover_bounds(self, options, line_amount, carried_over_amount):
        """
        Check if the line will be carried over, by checking the condition method set on the line.
        Do not override this method, but instead set your condition methods on each lines.
        :param options: The options of the reports
        :param line_amount: The amount on the line
        :param carried_over_amount: The amount carried over for this line
        :return: A tuple containing the lower and upper bounds from which the line will be carried over.
        E.g. (0, 42) : Lines which value is below 0 or above 42 will be carried over.
        E.g. (0, None) : Only lines which value is below 0 will be carried over.
        E.g. None : This line will never be carried over.
        """
        self.ensure_one()
        # Carry over is disabled by default, but if there is a carry over condition  method on the line we are
        # calling it first. That way we can have a default carryover condition for the whole report (carryover_bounds)
        # and specialized condition for specific lines if needed
        if self.carry_over_condition_method:
            condition_method = getattr(self, self.carry_over_condition_method, False)
            if condition_method:
                return condition_method(options, line_amount, carried_over_amount)

        return None

    def _get_carryover_lines_domain(self, options):
        """
        :param options: The report options
        :return: The domain that can be used to search for carryover lines for this tax report line.
        Using this domain instead of directly accessing the lines ensure that we only pick the ones related to the
        companies affecting the tax report.
        """
        self.ensure_one()
        domain = [('tax_report_line_id', '=', self.id)]

        if options.get('multi_company'):
            company_ids = [company['id'] for company in options['multi_company']]
            domain = expression.AND([domain, [('company_id', 'in', company_ids)]])
        else:
            domain = expression.AND([domain, [('company_id', '=', self.env.company.id)]])

        return domain

    def no_negative_amount_carry_over_condition(self, options, line_amount, carried_over_amount):
        # The bounds are (0, None).
        # Lines below 0 will be set to 0 and reduce the balance of the carryover.
        # Lines above 0 will never be carried over
        return (0, None)

    def always_carry_over_and_set_to_0(self, options, line_amount, carried_over_amount):
        # The bounds are (0, 0).
        # Lines below 0 will be set to 0 and reduce the balance of the carryover.
        # Lines above 0 will be set to 0 and increase the balance of the carryover.
        return (0, 0)

    def _get_carryover_destination_line(self, options):
        """
        Return the destination line for the carryover for this tax report line.
        :param options: The options of the tax report.
        :return: The line on which we'll carryover this tax report line when closing the tax period.
        """
        self.ensure_one()
        return self.carry_over_destination_line_id or self
