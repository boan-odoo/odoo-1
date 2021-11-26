# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models, fields, api, _
from odoo.osv import expression


class AccountReport(models.Model):
    _name = 'account.report'

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
    #TODO OCO filter_analytic
    #TODO OCO filter_hierarchy
    #TODO OCO filter_partner
    filter_fiscal_position = fields.Boolean(string="Use Foreign VAT Fiscal Positions", default=False) # TODO OCO renommer ce truc serait bien
    #TODO OCO order_selected_column
    strict_date = fields.Boolean(string="Strict Date", default=True) # TODO OCO remplace le strict_range ===> meilleur nom ? Peut-être en inversant le booléen ?
    # TODO OCO le special_date changer va être chiant avec ça. Genre, très. => On pourrait en mettre un sur le rapport directement qui sert de valeur par défaut à ses lignes ? Et les lignes peuvent spécifier le leur au besoin. (champ calculé éditable sur les lignes)
    # TODO OCO  ajouter un champ default_options ou default_filters ??? Genre avec un dict en str, qui permette de dire par exemple pour le tax report qu'il s'ouvre par défaut sur le mois passé ?
    # TODO OCO attention à la gestion des tax units => le filter_multi_company, en faire un champ sélection ? (3 choix: désactivé, avec le sélecteur ou tax unit)
    line_ids = fields.One2many(string="Lines", comodel_name='account.report.line', inverse_name='report_id')
    columns = fields.Char(string="Columns") #TODO OCO le rendre requis ; je ne le fais pas tout de suite car nique l'installation à cause des financial reports~~
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

    #TODO OCO réordonner les déclarations de champs (et décider d'un standard sur ce qu'on préfixe filter_)

    def write(self, vals):
        #TODO OCO reDOC: tax tag management

        if 'country_id' in vals:
            tags_cache = {}
            impacted_reports = self.filtered(lambda x: x.country_id.id != vals['country_id'])
            tax_tags_expressions = impacted_reports.line_ids.expression_ids.filtered(lambda x: x.engine == 'tax_tags')
            expressions_formulas = tax_tags_expressions.mapped('formula')

            for formula in expressions_formulas:
                tax_tags = self.env['account.account.tag']._get_tax_tags(formula, country.id)
                tag_reports = tax_tags._get_related_tax_report_expressions().report_line_id.report_id

                if all(report in self for report in tag_reports):
                    # Only reports in self are using these tags; let's change their country
                    tax_tags.write({'country_id': vals['country_id']})
                else:
                    # Another report uses these tags as well; let's keep them and create new tags in the target country
                    tag_vals = self.env['account.report.expression']._get_tags_create_vals(formula, vals['country_id'])
                    self.env['account.account.tag'].create(tag_vals)

        return super(AccountReport, self).write(vals)

    def validate_country_id(self):
        for record in self:
            if any(line.mapped('expression_ids.tag_ids.country_id') != record.country_id for line in record.line_ids):
                raise ValidationError(_("The tags associated with a report's expressions should all belong to the same country as that report."))


class AccountReportLine(models.Model):
    _name = 'account.report.line'
    _order = 'sequence, id'

    name = fields.Char(string="Name", required=True)
    expression_ids = fields.One2many(string="Expressions", comodel_name='account.report.expression', inverse_name='report_line_id')
    report_id = fields.Many2one(string="Parent Report", comodel_name='account.report', required=True)
    groupby = fields.Char(string="Group By") # TODO OCO la valeur du group by doit être acceptée par le moteur de la formule (en cas de multi colonnes, par les moteurs de chaque formule de la ligne => ce sera marrant ...)
    #TODO OCO je ne mets pas de notion de ligne parente ? Ca voudrait dire qu'on fait le flatten ici. A voir.
    sequence = fields.Integer(string="Sequence", required=True)
    column_values = fields.Char(string="Columns")#TODO OCO pas requis ? => Si pas set, prend les totaux de toutes les expressions, alors ? (et puis quand on a aucune expression, il faut voir)
    hierarchy_level = fields.Integer(string="Level", default=1, required=True)
    code = fields.Char(string="Code")
    unfoldable = fields.Boolean(string="Unfoldable", default=False)

    # TODO OCO ajouter le niveau de hiérarchie
    # TODO OCO ajouter invisible ?
    # TODO OCO ajouter la caret_option ici comme un champ, je dirais => sélection ??

    _sql_constraints = [
        ('code_uniq', 'unique (code)', "A report line with the same code already exists."),
    ]

class AccountReportExpression(models.Model):
    _name = 'account.report.expression' #TODO OCO ou rebaptiser line.cell pour éviter la confusion avec le champ formula ?

    # TODO OCO repasser sur le phrasing
    report_line_id = fields.Many2one(string="Report Line", comodel_name='account.report.line', required=True, ondelete='cascade')
    total = fields.Char(string="Total", required=True)
    engine = fields.Selection(
        string="Computation Engine",
        selection = [
            ('domain', 'Odoo Domain'),
            ('tax_tags', 'Tax Tags'),
            ('custom', 'Custom Code'),
            ('aggregation', 'Aggregate Other Formulas'),
            ('accounts_prefix', 'Prefix of accounts'),#TODO OCO
        ],
        required=True
    )

    formula = fields.Char(string="Formula")
    subformula = fields.Char(string="Subformula")
    date_scope = fields.Selection(
        string="Date Scope",
        #TODO OCO rename, redoc selection. This all could be clearer IMO :p
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

    def _get_matching_tags(self):
        # TODO OCO DOC
        tag_expressions = self.filtered(lambda x: x.engine == 'tax_tags')
        if not tag_expressions:
            return self.env['account.account.tag']

        domain = []
        for tag_expression in tag_expressions:
            country = tag_expression.report_line_id.report_id.country_id
            domain = expression.OR([domain, self.env['account.account.tag']._get_tax_tags_domain(tag_expression.formula, country.id)])

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
