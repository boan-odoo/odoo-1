# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from odoo import osv

from collections import defaultdict
import itertools
import re

class AccountReport(models.Model):
    _name = 'account.report'
    _description = "Accounting Report"

    #TODO OCO garder filter_ en préfixe ?? => Peut-être ... Ou pas ... On pourrait le garder juste sur les fonctions.
    name = fields.Char(string="Name", required=True)
    filter_multi_company = fields.Selection(
        string="Multi-Company",
        selection=[('disabled', "Disabled"), ('selector', "Use Company Selector"), ('tax_units', "Use Tax Units")],
        default='disabled',
        required=True,
    ) # TODO OCO on pourrait en faire un champ sélection (no, with_selector, with_tax_units)
    filter_date_range = fields.Boolean(string="Use Date Range", default=True) # TODO OCO remplace filter_date > True si range, False si date unique.
    allow_showing_draft = fields.Boolean(string="Allow Showing Draft Entries", default=True) #TODO OCO remplace filter_all_entries (qui n'est jamais passé à True, dirait-on)
    filter_unfold_all = fields.Boolean(string="Allow Unfolding All Lines", default=False) # TODO OCO on pourrait le calculer: si le rapport compte au moins une ligne unfoldable, on l'affiche (why not ?)
    allow_comparison = fields.Boolean(string="Allow Comparison", default=True)
    #TODO OCO filter_journals
    #TODO OCO filter_analytic (analytic sur les financial reports)
    #TODO OCO filter_hierarchy
    #TODO OCO filter_partner
    filter_fiscal_position = fields.Boolean(string="Use Foreign VAT Fiscal Positions", default=False) # TODO OCO renommer ce truc serait bien
    #TODO OCO order_selected_column
    strict_date = fields.Boolean(string="Strict Date", default=True) # TODO OCO remplace le strict_range ===> meilleur nom ? Peut-être en inversant le booléen ?
    # TODO OCO le special_date changer va être chiant avec ça. Genre, très. => On pourrait en mettre un sur le rapport directement qui sert de valeur par défaut à ses lignes ? Et les lignes peuvent spécifier le leur au besoin. (champ calculé éditable sur les lignes)
    # TODO OCO  ajouter un champ default_options ou default_filters ??? Genre avec un dict en str, qui permette de dire par exemple pour le tax report qu'il s'ouvre par défaut sur le mois passé ?
    # TODO OCO attention à la gestion des tax units => le filter_multi_company, en faire un champ sélection ? (3 choix: désactivé, avec le sélecteur ou tax unit)
    line_ids = fields.One2many(string="Lines", comodel_name='account.report.line', inverse_name='report_id')
    column_ids = fields.One2many(string="Columns", comodel_name='account.report.column', inverse_name='report_id')
    dynamic_lines_generator = fields.Char(string="Dynamic Lines Generator")
    # TODO OCO ajouter un genre de séquence pour dans le sélecteur de layout ===> 2.1 serait "2ème bloc, 1ère ligne", comme ça on garde les spérateurs (si besoin) => Ou bien une catégorie de rapport ??? => default = '0.0'
    root_report_id = fields.Many2one(string="Root Report", comodel_name='account.report') # TODO OCO DOC + il faudra créer le menuitem comme avec les financial reports
    variant_report_ids = fields.One2many(string="Variants", comodel_name='account.report', inverse_name='root_report_id')# TODO OCO contrainte pour empêcher de remplire ça s'il y a un root
    country_id = fields.Many2one(string="Country", comodel_name='res.country')
    country_group_id = fields.Many2one(string="Country Group", comodel_name='res.country.group') # TODO OCO rentre mutuellement exclusif avec le pays ? => Le pays prime, en tout cas. ===> Je ne sais pas si ça vaut la peine de le garder pour le moment. A voir. Pour intrastat ?
    availability_condition = fields.Selection(
        string="Available if",
        selection=[('country', "Country Matches"), ('always', "Always")], #TODO OCO ajouter using_oss dans OSS
        required=True,
        default='always',
    )
    filter_tax_exigible = fields.Boolean(string="Only Tax Exigible Lines", default=False, required=True)
    filter_unfold_all = fields.Boolean(string="Show 'Unfold All' Filter", default=False)
    ir_filter_ids = fields.Many2many(string="Applicable filters", comodel_name='ir.filters', help="Filters that can be used to filter and group lines on this report. This uses saved filtes on journal items") #TODO OCO REDOC + domaine

    #TODO OCO réordonner les déclarations de champs (et décider d'un standard sur ce qu'on préfixe filter_)

    def write(self, vals):
        #TODO OCO reDOC: tax tag management
        # TODO OCO s'assurer que ces changements de pays et leur impact sur le rapport sont testés
        if 'country_id' in vals:
            tags_cache = {}
            impacted_reports = self.filtered(lambda x: x.country_id.id != vals['country_id'])
            tax_tags_expressions = impacted_reports.line_ids.expression_ids.filtered(lambda x: x.engine == 'tax_tags')

            for expression in tax_tags_expressions:
                tax_tags = self.env['account.account.tag']._get_tax_tags(expression.formula, expression.report_line_id.report_id.country_id.id)
                tag_reports = tax_tags._get_related_tax_report_expressions().report_line_id.report_id

                if all(report in self for report in tag_reports):
                    # Only reports in self are using these tags; let's change their country
                    tax_tags.write({'country_id': vals['country_id']})
                else:
                    # Another report uses these tags as well; let's keep them and create new tags in the target country
                    tag_vals = self.env['account.report.expression']._get_tags_create_vals(expression.formula, vals['country_id'])
                    self.env['account.account.tag'].create(tag_vals)

        return super(AccountReport, self).write(vals)

    @api.model
    def _is_allowed_groupby_field(self, field_name):
        # TODO OCO utiliser dans une contrainte sur les groupby
        ''' Method used to filter the fields to be used in the group by filter.
        :param field:   An ir.model.field record.
        :return:        True if the field is allowed in the group by filter, False otherwise.
        ''' #TODO OCO check doc
        field = self.env['account.move.line']._fields.get(field_name)
        return field.name not in ('one2many', 'many2many') and field.store if field else False


class AccountReportLine(models.Model):
    _name = 'account.report.line'
    _description = "Accounting Report Line"
    _order = 'sequence, id'

    name = fields.Char(string="Name", required=True)
    expression_ids = fields.One2many(string="Expressions", comodel_name='account.report.expression', inverse_name='report_line_id')
    report_id = fields.Many2one(string="Parent Report", comodel_name='account.report', required=True)
    groupby = fields.Char(string="Group By") # TODO OCO la valeur du group by doit être acceptée par le moteur de la formule (en cas de multi colonnes, par les moteurs de chaque formule de la ligne => ce sera marrant ...)
    #TODO OCO je ne mets pas de notion de ligne parente ? Ca voudrait dire qu'on fait le flatten ici. A voir.
    sequence = fields.Integer(string="Sequence", required=True)
    hierarchy_level = fields.Integer(string="Level", default=1, required=True)
    code = fields.Char(string="Code")
    unfoldable = fields.Boolean(string="Unfoldable", default=False)

    # TODO OCO ajouter invisible ?
    # TODO OCO ajouter la caret_option ici comme un champ, je dirais => sélection ??

    _sql_constraints = [
        ('code_uniq', 'unique (code)', "A report line with the same code already exists."),
    ]

    @api.constrains('expression_ids')
    def _validate_formula(self):
        # TODO OCO vérifier l'impact sur le temps d'installation :/
        # TODO OCO compléter pour les autres moteurs serait pas mal
        aggregation_to_check = []
        for expression in self.expression_ids:
            if expression.engine == 'aggregation':
                term_line_codes = expression._get_aggregation_terms_details()
                aggregation_to_check.append((expression, term_line_codes))

        if aggregation_to_check:
            report_lines = self.env['account.report.line'].search([
                ('code', 'in', list(itertools.chain(*[term_line_codes.keys() for expression, term_line_code in aggregation_to_check]))),
            ])
            lines_by_code = {line.code: line for line in report_lines}

            for expression, term_line_codes in aggregation_to_check:
                for line_code, expression_totals in term_line_codes.items():
                    for total_name in expression_totals:
                        if line_code not in lines_by_code:
                            #raise ValidationError(_("No report line could be found for term '%s' of expression '%s'.", line_code, expression.formula))
                            continue # TODO OCO temporaire: ça ne marche pas à cause des lignes de niveaux supérieurs qui utilisent des lignes qui sont déclarées après ... ==> Que faire ? :/
                            # TODO OCO en fait, ce qu'il faudrait, c'est faire tourner ce check une fois le fichier loadé, quoi ... Pas comme une contrainte à l'installation
                            # Mais du coup, il faudrait quand même que depuis l'UI, ça marche comme une contrainte si on ajoute une ligne. hmmm ... Y'a une clé de contexte ?
                            # TODO OCO ====> Encore mieux: on pourrait ne pas le faire tourner à l'installation, mais dans un test, sur tous les rapports ! (à ajouter dans les l10n d'une façon ou d'une autre, donc)

                        target_line = lines_by_code[line_code]
                        if target_line.report_id != expression.report_line_id.report_id and expression.subformula != 'cross_report':
                            raise ValidationError(_("Term '%s' seems to be cross-report, while expression '%s' is not.", line_code, expression.formula))

                        if not target_line.expression_ids.filtered(lambda x: x.total == total_name):
                            raise ValidationError(_(
                                "Total '%s', used on term '%s' of expression '%s' is not defined.",
                                total_name, line_code, expression.formula
                            ))

class AccountReportExpression(models.Model):
    _name = 'account.report.expression' #TODO OCO ou rebaptiser line.cell pour éviter la confusion avec le champ formula ?
    _description = "Accounting Report Expression"

    # TODO OCO repasser sur le phrasing
    report_line_id = fields.Many2one(string="Report Line", comodel_name='account.report.line', required=True, ondelete='cascade')
    total = fields.Char(string="Total", required=True)
    engine = fields.Selection(
        string="Computation Engine",
        selection = [
            ('domain', "Odoo Domain"),
            ('tax_tags', "Tax Tags"),
            ('aggregation', "Aggregate Other Formulas"),
            ('account_codes', "Prefix of Account Codes"),
            ('external', "External Value"),
        ],
        required=True
    )
    formula = fields.Char(string="Formula")
    subformula = fields.Char(string="Subformula")
    date_scope = fields.Selection(
        string="Date Scope",
        #TODO OCO rename, redoc selection ? This all could be clearer IMO :p
        selection=[
            ('from_beginning', 'From the beginning'),
            ('to_beginning_of_period', 'At the beginning of the period'),
            ('normal', 'Use the dates that should normally be used, depending on the account types'),
            ('strict_range', 'Force given dates for all accounts and account types'),
            ('from_fiscalyear', 'From the beginning of the fiscal year'),
        ],
        required=True,
        default='strict_range',
    ) #TODO OCO j'ai donc changé le default ; ce n'est plus 'normal'

    # Carryover fields
    carryover_target = fields.Char(string="Carry Over To")# TODO OCO formule: code.label_de_total + contrainte=> seulement possible de la set si le label ne commence pas par _carryover

    #TODO OCO tester les flux de création et renommage de tags
    @api.model
    def create(self, vals): #TODO OCO au write aussi ? A tester, c'est vrai que ça peut vite être bizarre sans ça ... Si tu modifies une formule, quid ?
        rslt = super(AccountReportExpression, self).create(vals)

        tag_name = rslt.formula if rslt.engine == 'tax_tags' else None
        if tag_name:
            country = rslt.report_line_id.report_id.country_id
            existing_tags = self.env['account.account.tag']._get_tax_tags(tag_name, country.id)

            if not existing_tags:
                # We create new tags corresponding to this expression's formula.
                # The compute function will associate them with the expression.
                # TODO OCO s'assurer que le compute est bien appelé. ==> Mais dois-ce être un compute ? => Une fonction à appeler ?
                tag_vals = self._get_tags_create_vals(tag_name, country.id)
                self.env['account.account.tag'].create(tag_vals)

        return rslt

    def write(self, vals):
        rslt = super(AccountReportExpression, self).create(vals)

        if 'formula' in vals:
            tax_tags_expressions = expressions.filtered(lambda x: x.engine == 'tax_tags')
            expressions_formulas = tax_tags_expressions.mapped('formula')

            formulas_by_country = defaultdict(lambda: [])
            for expr in tax_tags_expressions:
                formulas_by_country[expr.report_line_id.report_id.country_id].append(expr.formula)

            for country, formula in formulas_by_country.items():
                tax_tags = self.env['account.account.tag']._get_tax_tags(formula, country.id)

                if all(tag_expr in self for tag_expr in tax_tags._get_related_tax_report_expressions()):
                    # If we're changing the formula of all the expressions using that tag, rename the tag
                    negative_tags = tax_tags.filtered(lambda x: x.tax_negate)
                    negative_tags.write({'name': '-%s' % formula})
                    (tax_tags - negative_tags).write({'name': '+%s' % formula})
                else:
                    # Else, create a new tag. Its the compute functions will make sure it is properly linked to the expressions
                    tag_vals = self.env['account.report.expression']._get_tags_create_vals(formula, country.id)
                    self.env['account.account.tag'].create(tag_vals)

        return rslt

    def _expand_aggregations(self):
        # TODO OCO DOC: retoure self + toutes les expressions dont les aggregations dépendent (enfin, tout ce qui a été trouvé de legit, en cas de cross_report)
        rslt = self

        to_expand = self.filtered(lambda x: x.engine == 'aggregation')
        while to_expand:
            domains = []

            for candidate_expr in to_expand:
                labels_by_code = to_expand._get_aggregation_terms_details()

                cross_report_domain = []
                if candidate_expr.subformula != 'cross_report':
                    cross_report_domain = [('report_line_id.report_id', '=', candidate_expr.report_line_id.report_id.id)]

                for line_code, expr_labels in labels_by_code.items():
                    dependency_domain = [('report_line_id.code', '=', line_code), ('total', 'in', tuple(expr_labels))] + cross_report_domain
                    domains.append(dependency_domain)

            sub_expressions = self.env['account.report.expression'].search(osv.expression.OR(domains))
            to_expand = sub_expressions.filtered(lambda x: x.engine == 'aggregation' and x not in rslt)
            rslt |= sub_expressions

        return rslt

    def _get_aggregation_terms_details(self):
        # TODO OCO DOC
        totals_by_code = defaultdict(lambda: set()) # e.g. {'A': {'balance', 'other'}, 'B': {'balance'}} if we the expression does formula=A.balance + B.balance + A.other
        for expression in self:
            if expression.engine != 'aggregation':
                raise UserError(_("Cannot get aggregation details from a line not using 'aggregation' engine"))

            expression_terms = re.split('[-+/*]', expression.formula.replace(' ', '')) # TODO une constante pour les opérateurs admis à l'aggrégation ?
            for term in expression_terms:
                if term: # term might be empty if the formula contains a negative term
                    line_code, total_name = term.split('.')
                    totals_by_code[line_code].add(total_name)

        return totals_by_code

    def _get_matching_tags(self):
        # TODO OCO DOC
        tag_expressions = self.filtered(lambda x: x.engine == 'tax_tags')
        if not tag_expressions:
            return self.env['account.account.tag']

        domain = []
        for tag_expression in tag_expressions:
            country = tag_expression.report_line_id.report_id.country_id
            domain = osv.expression.OR([domain, self.env['account.account.tag']._get_tax_tags_domain(tag_expression.formula, country.id)])

        return self.env['account.account.tag'].search(domain)

    @api.model
    def _get_tags_create_vals(self, tag_name, country_id):
        minus_tag_vals = {
          'name': '-' + tag_name,
          'applicability': 'taxes',
          'tax_negate': True,
          'country_id': country_id,
        }
        plus_tag_vals = {
          'name': '+' + tag_name,
          'applicability': 'taxes',
          'tax_negate': False,
          'country_id': country_id,
        }
        return [(minus_tag_vals), (plus_tag_vals)]

    def _get_carryover_target_expression(self):
        self.ensure_one()

        if self.carryover_target:
            line_code, expr_label = self.carryover_target.split('.')
            return self.env['account.report.expression'].search([
                ('report_line_id.code', '=', line_code),
                ('total', '=', expr_label),
                ('report_line_id.report_id', '=', self.report_line_id.report_id.id),
            ])

        main_expr_label = re.sub("^_carryover_", '', self.total)
        target_label = '_applied_carryover_%s' % main_expr_label
        auto_chosen_target = self.report_line_id.expression_ids.filtered(lambda x: x.total == target_label)

        if not auto_chosen_target:
            raise UserError(_("Could not determine carryover target automatically for expression %s.", self.total))

        return auto_chosen_target


class AccountReportColumn(models.Model):
    _name = 'account.report.column'
    _description = "Accounting Report Column"
    _order = 'sequence, id'

    name = fields.Char(string="Name", required=True)
    expression_label = fields.Char(string="Expression Label", required=True)
    sequence = fields.Integer(string="Sequence", default=0, required=True)
    report_id = fields.Many2one(string="Report", comodel_name='account.report')
    # TODO OCO ajouter le type de données dedans


class AccountReportExternalValue(models.Model):
    _name = 'account.report.external.value'
    _description = 'Accounting Report External Value'

    name = fields.Char(required=True)
    value = fields.Float(required=True)
    date = fields.Date(required=True)

    target_report_line_id = fields.Many2one(string="Target Line", comodel_name='account.report.line', required=True) # TODO OCO pas related pour pemettre le setup depuis l'UI, qui définit un domaine sur les expressions
    target_report_expression_id = fields.Many2one(string="Target Expression", comodel_name='account.report.expression', required=True, domain="[('id', 'in', available_target_expression_ids), ('engine', '=', 'external')]") # TODO OCO + contraintes
    company_id = fields.Many2one(string='Company', comodel_name='res.company', required=True, default=lambda self: self.env.company)

    report_country_id = fields.Many2one(string="Country", related='target_report_line_id.report_id.country_id')
    available_target_expression_ids = fields.One2many(string="Available Expressions", related='target_report_line_id.expression_ids')

    foreign_vat_fiscal_position_id = fields.Many2one( #TODO OCO il faudra aussi le set sur les valeurs manuelles, selon les options
        string="Fiscal position",
        comodel_name='account.fiscal.position',
        domain="[('company_id', '=', company_id), ('country_id', '=', report_country_id), ('foreign_vat', '!=', False)]",
        help="The foreign fiscal position for which this carryover is made.",
    )

    # Carryover fields
    carryover_origin_expression_id = fields.Many2one(string="Origin Expression", comodel_name='account.report.expression')
    carryover_origin_report_line_id = fields.Many2one(string="Origin Line", related='carryover_origin_expression_id.report_line_id') # TODO OCO pour l'UI

    @api.constrains('foreign_vat_fiscal_position_id', 'target_report_line_id')
    def _check_fiscal_position(self):
        if self.foreign_vat_fiscal_position_id and self.foreign_vat_fiscal_position_id.country_id != self.report_country_id:
            raise ValidationError(_("The country set on the the foreign VAT fiscal position must match the one set on the report."))
