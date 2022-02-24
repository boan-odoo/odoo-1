# -*- coding: utf-8 -*-

from odoo import models, _, Command, api, SUPERUSER_ID
from odoo.modules import get_resource_path
from odoo.addons.base.models.ir_translation import IrTranslationImport
import csv
import ast
from collections import defaultdict

import logging

_logger = logging.getLogger(__name__)

TEMPLATES = {
    'generic_coa': {'name': 'Generic Chart Template', 'country': None, 'modules': []},
    'be': {'name': 'BE Belgian PCMN', 'country': 'base.be', 'modules': ['l10n_be']},
    'fr': {'name': 'FR', 'country': 'base.fr', 'modules': ['l10n_fr']},
    'ch': {'name': 'CH', 'country': 'base.ch', 'modules': ['l10n_ch']},
    'de': {'name': 'DE', 'country': 'base.de', 'modules': ['l10n_de']},
}


def migrate_set_tags_and_taxes_updatable(cr, registry, module):
    ''' This is a utility function used to manually set the flag noupdate to False on tags and account tax templates on localization modules
    that need migration (for example in case of VAT report improvements)
    '''
    env = api.Environment(cr, SUPERUSER_ID, {})
    xml_record_ids = env['ir.model.data'].search([
        ('model', 'in', ['account.tax.template', 'account.account.tag']),
        ('module', 'like', module)
    ]).ids
    if xml_record_ids:
        cr.execute("update ir_model_data set noupdate = 'f' where id in %s", (tuple(xml_record_ids),))

def preserve_existing_tags_on_taxes(cr, registry, module):
    ''' This is a utility function used to preserve existing previous tags during upgrade of the module.'''
    env = api.Environment(cr, SUPERUSER_ID, {})
    xml_records = env['ir.model.data'].search([('model', '=', 'account.account.tag'), ('module', 'like', module)])
    if xml_records:
        cr.execute("update ir_model_data set noupdate = 't' where id in %s", [tuple(xml_records.ids)])

def delegate_to_super_if_code_doesnt_match(f):
    """
        This helper decorator helps build localized subclasses which methods
        are only used if the template_code matches their _code, otherwise it delegates
        to the next superclass in the chain.
        If the company argument is empty, it is defaulted with self.env.company
    """
    def wrapper(*args, **kwargs):
        self_class, template_code, company, *rest = args

        if template_code == self_class._template_code:
            return f(*args, **kwargs)
        for cls in self_class.__class__.__mro__:
            if hasattr(cls, '_template_code') and cls._template_code == template_code:
                if not company:
                    company = cls.env.company
                target_method = getattr(cls, f.__name__)
                return target_method(self_class, template_code, company, *rest, **kwargs)
        raise ValueError(f"Template code {template_code} is not found in any chart_template.")
    return wrapper


class AccountChartTemplate(models.AbstractModel):
    _name = "account.chart.template"
    _description = "Account Chart Template"
    _template_code = "generic_coa"

    def _select_chart_template(self, company=False):
        company = company or self.env.company
        result = [(ct, string) for ct, string, country, modules in TEMPLATES]
        if self:
            proposed = self._guess_chart_template(company)
            result.sort(key=lambda sel: (sel[0] != proposed, sel[1]))
        return result

    def _guess_chart_template(self, company=False):
        company = company or self.env.company
        default = AccountChartTemplate._template_code
        if not company.country_id:
            return default
        country_code = company.country_id.get_metadata()[0]['xmlid']
        return next((key for key, template in TEMPLATES.items() if template['country'] == country_code), default)

    def try_loading(self, template_code=False, company=False, install_demo=True):
        """ Installs this chart of accounts for the current company if not chart
        of accounts had been created for it yet.

        :param template_code (str): code of the chart template to be loaded.
        :param company (Model<res.company>): the company we try to load the chart template on.
            If not provided, it is retrieved from the context.
        :param install_demo (bool): whether or not we should load demo data right after loading the
            chart template.
        """
        company = company or self.env.company
        template_code = template_code or self._guess_chart_template(company)

        module_names = TEMPLATES[template_code].get('modules', [])
        module_ids = self.env['ir.module.module'].search([('name', 'in', module_names), ('state', '=', 'uninstalled')])
        if module_ids:
            module_ids.sudo().button_immediate_install()
            self.env.reset()

        with_company = self.sudo().with_context(default_company_id=company.id, allowed_company_ids=[company.id])
        # If we don't have any chart of account on this company, install this chart of account
        if not company.existing_accounting():
            xml_id = company.get_metadata()[0]['xmlid']
            if not xml_id:
                xml_id = f"base.company_{company.id}"
                with_company.env['ir.model.data']._update_xmlids([{'xml_id': xml_id, 'record': company}])
            data = with_company._get_chart_template_data(template_code, company)
            with_company._load_data(data)
            with_company._post_load_data(template_code, company)
            company.flush()
            with_company.env.cache.invalidate()
            # Install the demo data when the first localization is instanciated on the company
            if install_demo and with_company.env.ref('base.module_account').demo:
                try:
                    with with_company.env.cr.savepoint():
                        with_company._load_data(with_company._get_demo_data(company))
                        with_company._post_load_demo_data(company)
                except Exception:
                    # Do not rollback installation of CoA if demo data failed
                    _logger.exception('Error while loading accounting demo data')

    def _load_data(self, data):
        def deref(values, model):
            for field, value in values.items():
                if field not in model._fields:
                    continue
                if model._fields[field].type in ('many2one', 'integer', 'many2one_reference') and isinstance(value, str):
                    values[field] = self.env.ref(value).id
                elif model._fields[field].type in ('one2many', 'many2many'):
                    if value and isinstance(value[0], (list, tuple)):
                        for command in value:
                            if command[0] in (Command.CREATE, Command.UPDATE):
                                deref(command[2], self.env[model._fields[field].comodel_name])
                            if command[0] == Command.SET:
                                for i, value in enumerate(command[2]):
                                    if isinstance(value, str):
                                        command[2][i] = self.env.ref(value).id
            return values

        def defer(all_data):
            created_models = set()
            while all_data:
                (model, data), *all_data = all_data
                created_models.add(model)
                to_delay = defaultdict(dict)
                for xml_id, vals in data.items():
                    for field_name in vals:
                        field = self.env[model]._fields.get(field_name, None)
                        if (field and
                            field.relational and
                            field.comodel_name not in created_models and
                            field.comodel_name in dict(all_data)):
                            to_delay[xml_id][field_name] = vals.pop(field_name)
                if any(to_delay.values()):
                    all_data.append((model, to_delay))
                yield model, data

        irt_cursor = IrTranslationImport(self._cr, True)
        for model, data in defer(list(data.items())):
            translate_vals = defaultdict(list)
            create_vals = []
            for xml_id, record in data.items():
                xml_id = "account.%s" % xml_id if '.' not in xml_id else xml_id
                for translate, value in list(record.items()):
                    if '@' in translate:
                        if value:
                            field, lang = translate.split('@')
                            translate_vals[xml_id].append({
                                'type': 'model',
                                'name': f'{model},{field}',
                                'lang': lang,
                                'src': record[field],
                                'value': value,
                                'comments': None,
                                'imd_model': model,
                                'imd_name': xml_id,
                                'module': 'account',
                            })
                        del record[translate]
                create_vals.append({
                    'xml_id': xml_id,
                    'values': deref(record, self.env[model]),
                    'noupdate': True,
                })
            _logger.debug('Loading model %s', model)
            created = self.env[model].sudo()._load_records(create_vals)
            _logger.debug('Loaded model %s', model)
            for vals, record in zip(create_vals, created):
                for translation in translate_vals[vals['xml_id']]:
                    irt_cursor.push({**translation, 'res_id': record.id})
        irt_cursor.finish()

    def _load_csv(self, module, company, file_name, post_sanitize=None):
        cid = (company or self.env.company).id
        Model = self.env[".".join(file_name.split(".")[:-1])]
        model_fields = Model._fields
        path_parts = [x for x in ('account', 'data', 'template', module, file_name) if x]
        # Should the path be False then open(False, 'r') will open STDIN for reading
        path = get_resource_path(*path_parts) or ''

        def basic_sanitize_csv(row):
            return {
                key: (
                    value if '@' in key
                    else ast.literal_eval(value) if model_fields[key].type in ('boolean', 'int', 'float')
                    else (value and Model.env.ref(value).id or False) if model_fields[key].type == 'many2one'
                    else (value and Model.env.ref(value).ids or []) if model_fields[key].type in ('one2many', 'many2many')
                    else value
                )
                for key, value in ((key.replace('/id', ''), value) for key, value in row.items())
                if key != 'id'
            }

        if not post_sanitize:
            sanitize_csv = basic_sanitize_csv
        else:
            def sanitize_csv(row):
                return post_sanitize(basic_sanitize_csv(row))

        try:
            with open(path, 'r', encoding="utf-8") as csv_file:
                _logger.info('loading %s', '/'.join(path_parts))
                return {f"{cid}_{row['id']}": sanitize_csv(row) for row in csv.DictReader(csv_file)}
        except OSError as e:
            if path:
                _logger.info("Error reading CSV file %s: %s", path, e)
            else:
                _logger.debug("No file %s found for template '%s'", file_name, module)
            return {}

    def _get_chart_template_data(self, template_code, company):
        company = company or self.env.company
        return {
            'account.account': self._get_account_account(template_code, company),
            'account.group': self._get_account_group(template_code, company),
            'account.journal': self._get_account_journal(template_code, company),
            'res.company': self._get_res_company(template_code, company),
            'account.tax.group': self._get_tax_group(template_code, company),
            'account.tax': self._get_account_tax(template_code, company),
        }

# <<<<<<< HEAD
#     @api.model
#     def _create_liquidity_journal_suspense_account(self, company, code_digits):
#         return self.env['account.account'].create({
#             'name': _("Bank Suspense Account"),
#             'code': self.env['account.account']._search_new_account_code(company, code_digits, company.bank_account_code_prefix or ''),
#             'user_type_id': self.env.ref('account.data_account_type_current_assets').id,
#             'company_id': company.id,
#         })

    def _get_account_account(self, template_code, company):
        return self._load_csv(template_code, company, 'account.account.csv')

    def _get_account_group(self, template_code, company):
        def account_group_sanitize(row):
            start, end = row['code_prefix_start'], row['code_prefix_end']
            if not end or end < start:
                row['code_prefix_end'] = start
            return row
        return self._load_csv(template_code, company, 'account.group.csv', post_sanitize=account_group_sanitize)

    def _get_tax_group(self, template_code, company):
        return self._load_csv(template_code, company, 'account.tax.group.csv')

    def _post_load_data(self, template_code, company):
        company = (company or self.env.company)
        cid = company.id
        ref = self.env.ref
        template_data = self._get_template_data(template_code, company)
        code_digits = template_data.get('code_digits', 6)
        # Set default cash difference account on company
        if not company.account_journal_suspense_account_id:
            company.account_journal_suspense_account_id = self.env['account.account'].create({
                'name': _("Bank Suspense Account"),
                'code': self.env['account.account']._search_new_account_code(company, code_digits, company.bank_account_code_prefix or ''),
                'user_type_id': self.env.ref('account.data_account_type_current_liabilities').id,
                'company_id': cid,
            })

        account_type_current_assets = self.env.ref('account.data_account_type_current_assets')
        if not company.account_journal_payment_debit_account_id:
            company.account_journal_payment_debit_account_id = self.env['account.account'].create({
                'name': _("Outstanding Receipts"),
                'code': self.env['account.account']._search_new_account_code(company, code_digits, company.bank_account_code_prefix or ''),
                'reconcile': True,
                'user_type_id': account_type_current_assets.id,
                'company_id': cid,
            })

        if not company.account_journal_payment_credit_account_id:
            company.account_journal_payment_credit_account_id = self.env['account.account'].create({
                'name': _("Outstanding Payments"),
                'code': self.env['account.account']._search_new_account_code(company, code_digits, company.bank_account_code_prefix or ''),
                'reconcile': True,
                'user_type_id': account_type_current_assets.id,
                'company_id': cid,
            })

        if not company.default_cash_difference_expense_account_id:
            company.default_cash_difference_expense_account_id = self.env['account.account'].create({
                'name': _('Cash Difference Loss'),
                'code': self.env['account.account']._search_new_account_code(company, code_digits, '999'),
                'user_type_id': self.env.ref('account.data_account_type_expenses').id,
                'tag_ids': [(6, 0, self.env.ref('account.account_tag_investing').ids)],
                'company_id': cid,
            })

        if not company.default_cash_difference_income_account_id:
            company.default_cash_difference_income_account_id = self.env['account.account'].create({
                'name': _('Cash Difference Gain'),
                'code': self.env['account.account']._search_new_account_code(company, code_digits, '999'),
                'user_type_id': self.env.ref('account.data_account_type_revenue').id,
                'tag_ids': [(6, 0, self.env.ref('account.account_tag_investing').ids)],
                'company_id': cid,
            })

        # Set the transfer account on the company
        transfer_account_code_prefix = template_data['transfer_account_code_prefix']
        company.transfer_account_id = self.env['account.account'].search([
            ('code', '=like', transfer_account_code_prefix + '%'), ('company_id', '=', cid)], limit=1)

        # Create the current year earning account if it wasn't present in the CoA
        company.get_unaffected_earnings_account()

        if not company.account_sale_tax_id:
            company.account_sale_tax_id = self.env['account.tax'].search([
                ('type_tax_use', 'in', ('sale', 'all')),
                ('company_id', '=', cid)
            ], limit=1).id
        if not company.account_purchase_tax_id:
            company.account_purchase_tax_id = self.env['account.tax'].search([
                ('type_tax_use', 'in', ('purchase', 'all')),
                ('company_id', '=', cid)
            ], limit=1).id

# <<<<<<< HEAD
#         if self.country_id:
#             # If this CoA is made for only one country, set it as the fiscal country of the company.
#             company.account_fiscal_country_id = self.country_id
#
#         return {}
#
#     @api.model
#     def existing_accounting(self, company_id):
#         """ Returns True iff some accounting entries have already been made for
#         the provided company (meaning hence that its chart of accounts cannot
#         be changed anymore).
#         """
#         model_to_check = ['account.payment', 'account.bank.statement']
#         for model in model_to_check:
#             if self.env[model].sudo().search([('company_id', '=', company_id.id)], limit=1):
#                 return True
#         if self.env['account.move'].sudo().search([('company_id', '=', company_id.id), ('state', '!=', 'draft')], limit=1):
#             return True
#         return False
#
#     def _create_tax_templates_from_rates(self, company_id, sale_tax_rate, purchase_tax_rate):
#         '''
#         This function checks if this chart template is configured as containing a full set of taxes, and if
#         it's not the case, it creates the templates for account.tax object accordingly to the provided sale/purchase rates.
#         Then it saves the new tax templates as default taxes to use for this chart template.
#
#         :param company_id: id of the company for which the wizard is running
#         :param sale_tax_rate: the rate to use for created sales tax
#         :param purchase_tax_rate: the rate to use for created purchase tax
#         :return: True
#         '''
#         self.ensure_one()
#         obj_tax_temp = self.env['account.tax.template']
#         all_parents = self._get_chart_parent_ids()
#         # create tax templates from purchase_tax_rate and sale_tax_rate fields
#         if not self.complete_tax_set:
#             ref_taxs = obj_tax_temp.search([('type_tax_use', '=', 'sale'), ('chart_template_id', 'in', all_parents)], order="sequence, id desc", limit=1)
#             ref_taxs.write({'amount': sale_tax_rate, 'name': _('Tax %.2f%%') % sale_tax_rate, 'description': '%.2f%%' % sale_tax_rate})
#             ref_taxs = obj_tax_temp.search([('type_tax_use', '=', 'purchase'), ('chart_template_id', 'in', all_parents)], order="sequence, id desc", limit=1)
#             ref_taxs.write({'amount': purchase_tax_rate, 'name': _('Tax %.2f%%') % purchase_tax_rate, 'description': '%.2f%%' % purchase_tax_rate})
#         return True
#
#     def _get_chart_parent_ids(self):
#         """ Returns the IDs of all ancestor charts, including the chart itself.
#             (inverse of child_of operator)
#
#             :return: the IDS of all ancestor charts, including the chart itself.
#         """
#         chart_template = self
#         result = [chart_template.id]
#         while chart_template.parent_id:
#             chart_template = chart_template.parent_id
#             result.append(chart_template.id)
#         return result
#
#     def _create_bank_journals(self, company, acc_template_ref):
#         '''
#         This function creates bank journals and their account for each line
#         data returned by the function _get_default_bank_journals_data.
#
#         :param company: the company for which the wizard is running.
#         :param acc_template_ref: the dictionary containing the mapping between the ids of account templates and the ids
#             of the accounts that have been generated from them.
#         '''
#         self.ensure_one()
#         bank_journals = self.env['account.journal']
#         # Create the journals that will trigger the account.account creation
#         for acc in self._get_default_bank_journals_data():
#             bank_journals += self.env['account.journal'].create({
#                 'name': acc['acc_name'],
#                 'type': acc['account_type'],
#                 'company_id': company.id,
#                 'currency_id': acc.get('currency_id', self.env['res.currency']).id,
#                 'sequence': 10,
#             })
#
#         return bank_journals
#
#     @api.model
#     def _get_default_bank_journals_data(self):
#         """ Returns the data needed to create the default bank journals when
#         installing this chart of accounts, in the form of a list of dictionaries.
#         The allowed keys in these dictionaries are:
#             - acc_name: string (mandatory)
#             - account_type: 'cash' or 'bank' (mandatory)
#             - currency_id (optional, only to be specified if != company.currency_id)
#         """
#         return [{'acc_name': _('Cash'), 'account_type': 'cash'}, {'acc_name': _('Bank'), 'account_type': 'bank'}]
#
#     @api.model
#     def generate_journals(self, acc_template_ref, company, journals_dict=None):
#         """
#         This method is used for creating journals.
#
#         :param acc_template_ref: Account templates reference.
#         :param company_id: company to generate journals for.
#         :returns: True
#         """
#         JournalObj = self.env['account.journal']
#         for vals_journal in self._prepare_all_journals(acc_template_ref, company, journals_dict=journals_dict):
#             journal = JournalObj.create(vals_journal)
#             if vals_journal['type'] == 'general' and vals_journal['code'] == _('EXCH'):
#                 company.write({'currency_exchange_journal_id': journal.id})
#             if vals_journal['type'] == 'general' and vals_journal['code'] == _('CABA'):
#                 company.write({'tax_cash_basis_journal_id': journal.id})
#         return True
#
#     def _prepare_all_journals(self, acc_template_ref, company, journals_dict=None):
#         def _get_default_account(journal_vals, type='debit'):
#             # Get the default accounts
#             default_account = False
#             if journal['type'] == 'sale':
#                 default_account = acc_template_ref.get(self.property_account_income_categ_id).id
#             elif journal['type'] == 'purchase':
#                 default_account = acc_template_ref.get(self.property_account_expense_categ_id).id
#
#             return default_account
#
#         journals = [{'name': _('Customer Invoices'), 'type': 'sale', 'code': _('INV'), 'favorite': True, 'color': 11, 'sequence': 5},
#                     {'name': _('Vendor Bills'), 'type': 'purchase', 'code': _('BILL'), 'favorite': True, 'color': 11, 'sequence': 6},
#                     {'name': _('Miscellaneous Operations'), 'type': 'general', 'code': _('MISC'), 'favorite': True, 'sequence': 7},
#                     {'name': _('Exchange Difference'), 'type': 'general', 'code': _('EXCH'), 'favorite': False, 'sequence': 9},
#                     {'name': _('Cash Basis Taxes'), 'type': 'general', 'code': _('CABA'), 'favorite': False, 'sequence': 10}]
#         if journals_dict != None:
#             journals.extend(journals_dict)
#
#         self.ensure_one()
#         journal_data = []
#         for journal in journals:
#             vals = {
#                 'type': journal['type'],
#                 'name': journal['name'],
#                 'code': journal['code'],
#                 'company_id': company.id,
#                 'default_account_id': _get_default_account(journal),
#                 'show_on_dashboard': journal['favorite'],
#                 'color': journal.get('color', False),
#                 'sequence': journal['sequence']
#             }
#             journal_data.append(vals)
#         return journal_data
#
#     def generate_properties(self, acc_template_ref, company):
#         """
#         This method used for creating properties.
#
#         :param acc_template_ref: Mapping between ids of account templates and real accounts created from them
#         :param company_id: company to generate properties for.
#         :returns: True
#         """
#         self.ensure_one()
#         PropertyObj = self.env['ir.property']
#         todo_list = [
# =======
        for field, model in [
# >>>>>>> 1eb2ebef96a ([REF] account: remove chart template)
            ('property_account_receivable_id', 'res.partner'),
            ('property_account_payable_id', 'res.partner'),
            ('property_account_expense_categ_id', 'product.category'),
            ('property_account_income_categ_id', 'product.category'),
            ('property_account_expense_id', 'product.template'),
            ('property_account_income_id', 'product.template'),
            ('property_tax_payable_account_id', 'account.tax.group'),
            ('property_tax_receivable_account_id', 'account.tax.group'),
            ('property_advance_tax_payment_account_id', 'account.tax.group'),
        ]:
            value = template_data.get(field)
            if value:
                self.env['ir.property']._set_default(field, model, ref(f"account.{cid}_{value}").id, company=company)

    ###############################################################################################
    # GENERIC Template                                                                            #
    ###############################################################################################

    def _get_template_data(self, template_code, company):
        return {
            'bank_account_code_prefix': '1014',
            'cash_account_code_prefix': '1015',
            'transfer_account_code_prefix': '1017',
            'property_account_receivable_id': 'receivable',
            'property_account_payable_id': 'payable',
            'property_account_expense_categ_id': 'expense',
            'property_account_income_categ_id': 'income',
            'property_account_expense_id': 'expense',
            'property_account_income_id': 'income',
            'property_tax_payable_account_id': 'tax_payable',
            'property_tax_receivable_account_id': 'tax_receivable',
            'property_advance_tax_payment_account_id': 'cash_diff_income',  # TODO
        }

    def _get_account_journal(self, template_code, company):
        cid = (company or self.env.company).id
        return {
            f"{cid}_sale": {
                'name': _('Customer Invoices'),
                'type': 'sale',
                'code': _('INV'),
                'default_account_id': f"account.{cid}_income",
                'show_on_dashboard': True,
                'color': 11,
                'sequence': 5,
            },
            f"{cid}_purchase": {
                'name': _('Vendor Bills'),
                'type': 'purchase',
                'code': _('BILL'),
                'default_account_id': f"account.{cid}_expense",
                'show_on_dashboard': True,
                'color': 11,
                'sequence': 6,
            },
            f"{cid}_general": {
                'name': _('Miscellaneous Operations'),
                'type': 'general',
                'code': _('MISC'),
                'show_on_dashboard': True,
                'sequence': 7,
            },
            f"{cid}_exch": {
                'name': _('Exchange Difference'),
                'type': 'general',
                'code': _('EXCH'),
                'show_on_dashboard': False,
                'sequence': 9,
            },
            f"{cid}_caba": {
                'name': _('Cash Basis Taxes'),
                'type': 'general',
                'code': _('CABA'),
                'show_on_dashboard': False,
                'sequence': 10,
            },
            f"{cid}_cash": {
                'name': _('Cash'),
                'type': 'cash',
                'suspense_account_id': f"account.{cid}_cash_diff_income",  # TODO
            },
            f"{cid}_bank": {
                'name': _('Bank'),
                'type': 'bank',
                'suspense_account_id': f"account.{cid}_cash_diff_income",  # TODO
            },
        }

    def _get_account_tax(self, template_code, company):
        cid = (company or self.env.company).id
        return {
            f"{cid}_sale_tax_template": {
                "name": _("Tax 15%"),
                "amount": 15,
                "type_tax_use": 'sale',
                "tax_group_id": f'account.{cid}_tax_group_15',
                "invoice_repartition_line_ids": [
                    Command.clear(),
                    Command.create({
                        'factor_percent': 100,
                        'repartition_type': 'base',
                    }),
                    Command.create({
                        'factor_percent': 100,
                        'repartition_type': 'tax',
                        'account_id': f'account.{cid}_tax_received',
                    }),
                ],
                "refund_repartition_line_ids": [
                    Command.clear(),
                    Command.create({
                        'factor_percent': 100,
                        'repartition_type': 'base',
                    }),
                    Command.create({
                        'factor_percent': 100,
                        'repartition_type': 'tax',
                        'account_id': f'account.{cid}_tax_received',
                    }),
                ],
            },
            f"{cid}_purchase_tax_template": {
                "name": _("Purchase Tax 15%"),
                "amount": 15,
                "type_tax_use": 'purchase',
                "tax_group_id": f'account.{cid}_tax_group_15',
                "invoice_repartition_line_ids": [
                    Command.clear(),
                    Command.create({
                        'factor_percent': 100,
                        'repartition_type': 'base',
                    }),
                    Command.create({
                        'factor_percent': 100,
                        'repartition_type': 'tax',
                        'account_id': f'account.{cid}_tax_received',
                    }),
                ],
                "refund_repartition_line_ids": [
                    Command.clear(),
                    Command.create({
                        'factor_percent': 100,
                        'repartition_type': 'base',
                    }),
                    Command.create({
                        'factor_percent': 100,
                        'repartition_type': 'tax',
                        'account_id': f'account.{cid}_tax_received',
                    }),
                ],
            },
        }

    def _get_res_company(self, template_code, company):
        cid = (company or self.env.company).id
        return {
            self.env.company.get_metadata()[0]['xmlid']: {
                'currency_id': 'base.USD',
                'account_fiscal_country_id': 'base.us',
                'default_cash_difference_income_account_id': f'account.{cid}_cash_diff_income',
                'default_cash_difference_expense_account_id': f'account.{cid}_cash_diff_expense',
                'account_cash_basis_base_account_id': f'account.{cid}_cash_diff_income',  # TODO
                'account_default_pos_receivable_account_id': f'account.{cid}_cash_diff_income',  # TODO
                'income_currency_exchange_account_id': f'account.{cid}_income_currency_exchange',
                'expense_currency_exchange_account_id': f'account.{cid}_expense_currency_exchange',
            }
        }
# <<<<<<< HEAD
#
# # Tax Repartition Line Template
#
#
# class AccountTaxRepartitionLineTemplate(models.Model):
#     _name = "account.tax.repartition.line.template"
#     _description = "Tax Repartition Line Template"
#
#     factor_percent = fields.Float(string="%", required=True, help="Factor to apply on the account move lines generated from this distribution line, in percents")
#     repartition_type = fields.Selection(string="Based On", selection=[('base', 'Base'), ('tax', 'of tax')], required=True, default='tax', help="Base on which the factor will be applied.")
#     account_id = fields.Many2one(string="Account", comodel_name='account.account.template', help="Account on which to post the tax amount")
#     invoice_tax_id = fields.Many2one(comodel_name='account.tax.template', help="The tax set to apply this distribution on invoices. Mutually exclusive with refund_tax_id")
#     refund_tax_id = fields.Many2one(comodel_name='account.tax.template', help="The tax set to apply this distribution on refund invoices. Mutually exclusive with invoice_tax_id")
#     tag_ids = fields.Many2many(string="Financial Tags", relation='account_tax_repartition_financial_tags', comodel_name='account.account.tag', copy=True, help="Additional tags that will be assigned by this repartition line for use in financial reports")
#     use_in_tax_closing = fields.Boolean(string="Tax Closing Entry")
#
#     # These last two fields are helpers used to ease the declaration of account.account.tag objects in XML.
#     # They are directly linked to account.tax.report.line objects, which create corresponding + and - tags
#     # at creation. This way, we avoid declaring + and - separately every time.
#     plus_report_line_ids = fields.Many2many(string="Plus Tax Report Lines", relation='account_tax_repartition_plus_report_line', comodel_name='account.tax.report.line', copy=True, help="Tax report lines whose '+' tag will be assigned to move lines by this repartition line")
#     minus_report_line_ids = fields.Many2many(string="Minus Report Lines", relation='account_tax_repartition_minus_report_line', comodel_name='account.tax.report.line', copy=True, help="Tax report lines whose '-' tag will be assigned to move lines by this repartition line")
#
#     @api.model_create_multi
#     def create(self, vals_list):
#         for vals in vals_list:
#             if vals.get('plus_report_line_ids'):
#                 vals['plus_report_line_ids'] = self._convert_tag_syntax_to_orm(vals['plus_report_line_ids'])
#
#             if vals.get('minus_report_line_ids'):
#                 vals['minus_report_line_ids'] = self._convert_tag_syntax_to_orm(vals['minus_report_line_ids'])
#
#             if vals.get('tag_ids'):
#                 vals['tag_ids'] = self._convert_tag_syntax_to_orm(vals['tag_ids'])
#
#             if vals.get('use_in_tax_closing') is None:
#                 if not vals.get('account_id'):
#                     vals['use_in_tax_closing'] = False
#                 else:
#                     internal_group = self.env['account.account.template'].browse(vals.get('account_id')).user_type_id.internal_group
#                     vals['use_in_tax_closing'] = not (internal_group == 'income' or internal_group == 'expense')
#
#         return super().create(vals_list)
#
#     @api.model
#     def _convert_tag_syntax_to_orm(self, tags_list):
#         """ Repartition lines give the possibility to directly give
#         a list of ids to create for tags instead of a list of ORM commands.
#
#         This function checks that tags_list uses this syntactic sugar and returns
#         an ORM-compliant version of it if it does.
#         """
#         if tags_list and all(isinstance(elem, int) for elem in tags_list):
#             return [(6, False, tags_list)]
#         return tags_list
#
#     @api.constrains('invoice_tax_id', 'refund_tax_id')
#     def validate_tax_template_link(self):
#         for record in self:
#             if record.invoice_tax_id and record.refund_tax_id:
#                 raise ValidationError(_("Tax distribution line templates should apply to either invoices or refunds, not both at the same time. invoice_tax_id and refund_tax_id should not be set together."))
#
#     @api.constrains('plus_report_line_ids', 'minus_report_line_ids')
#     def validate_tags(self):
#         all_tax_rep_lines = self.mapped('plus_report_line_ids') + self.mapped('minus_report_line_ids')
#         lines_without_tag = all_tax_rep_lines.filtered(lambda x: not x.tag_name)
#         if lines_without_tag:
#             raise ValidationError(_("The following tax report lines are used in some tax distribution template though they don't generate any tag: %s . This probably means you forgot to set a tag_name on these lines.", str(lines_without_tag.mapped('name'))))
#
#     def get_repartition_line_create_vals(self, company):
#         rslt = [(5, 0, 0)]
#         for record in self:
#             tags_to_add = self.env['account.account.tag']
#             tags_to_add += record.plus_report_line_ids.mapped('tag_ids').filtered(lambda x: not x.tax_negate)
#             tags_to_add += record.minus_report_line_ids.mapped('tag_ids').filtered(lambda x: x.tax_negate)
#             tags_to_add += record.tag_ids
#
#             rslt.append((0, 0, {
#                 'factor_percent': record.factor_percent,
#                 'repartition_type': record.repartition_type,
#                 'tag_ids': [(6, 0, tags_to_add.ids)],
#                 'company_id': company.id,
#                 'use_in_tax_closing': record.use_in_tax_closing
#             }))
#         return rslt
#
# # Fiscal Position Templates
#
# class AccountFiscalPositionTemplate(models.Model):
#     _name = 'account.fiscal.position.template'
#     _description = 'Template for Fiscal Position'
#
#     sequence = fields.Integer()
#     name = fields.Char(string='Fiscal Position Template', required=True)
#     chart_template_id = fields.Many2one('account.chart.template', string='Chart Template', required=True)
#     account_ids = fields.One2many('account.fiscal.position.account.template', 'position_id', string='Account Mapping')
#     tax_ids = fields.One2many('account.fiscal.position.tax.template', 'position_id', string='Tax Mapping')
#     note = fields.Text(string='Notes')
#     auto_apply = fields.Boolean(string='Detect Automatically', help="Apply automatically this fiscal position.")
#     vat_required = fields.Boolean(string='VAT required', help="Apply only if partner has a VAT number.")
#     country_id = fields.Many2one('res.country', string='Country',
#         help="Apply only if delivery country matches.")
#     country_group_id = fields.Many2one('res.country.group', string='Country Group',
#         help="Apply only if delivery country matches the group.")
#     state_ids = fields.Many2many('res.country.state', string='Federal States')
#     zip_from = fields.Char(string='Zip Range From')
#     zip_to = fields.Char(string='Zip Range To')
#
#
# class AccountFiscalPositionTaxTemplate(models.Model):
#     _name = 'account.fiscal.position.tax.template'
#     _description = 'Tax Mapping Template of Fiscal Position'
#     _rec_name = 'position_id'
#
#     position_id = fields.Many2one('account.fiscal.position.template', string='Fiscal Position', required=True, ondelete='cascade')
#     tax_src_id = fields.Many2one('account.tax.template', string='Tax Source', required=True)
#     tax_dest_id = fields.Many2one('account.tax.template', string='Replacement Tax')
#
#
# class AccountFiscalPositionAccountTemplate(models.Model):
#     _name = 'account.fiscal.position.account.template'
#     _description = 'Accounts Mapping Template of Fiscal Position'
#     _rec_name = 'position_id'
#
#     position_id = fields.Many2one('account.fiscal.position.template', string='Fiscal Mapping', required=True, ondelete='cascade')
#     account_src_id = fields.Many2one('account.account.template', string='Account Source', required=True)
#     account_dest_id = fields.Many2one('account.account.template', string='Account Destination', required=True)
#
#
# class AccountReconcileModelTemplate(models.Model):
#     _name = "account.reconcile.model.template"
#     _description = 'Reconcile Model Template'
#
#     # Base fields.
#     chart_template_id = fields.Many2one('account.chart.template', string='Chart Template', required=True)
#     name = fields.Char(string='Button Label', required=True)
#     sequence = fields.Integer(required=True, default=10)
#
#     rule_type = fields.Selection(selection=[
#         ('writeoff_button', 'Button to generate counterpart entry'),
#         ('writeoff_suggestion', 'Rule to suggest counterpart entry'),
#         ('invoice_matching', 'Rule to match invoices/bills'),
#     ], string='Type', default='writeoff_button', required=True)
#     auto_reconcile = fields.Boolean(string='Auto-validate',
#         help='Validate the statement line automatically (reconciliation based on your rule).')
#     to_check = fields.Boolean(string='To Check', default=False, help='This matching rule is used when the user is not certain of all the information of the counterpart.')
#     matching_order = fields.Selection(
#         selection=[
#             ('old_first', 'Oldest first'),
#             ('new_first', 'Newest first'),
#         ]
#     )
#
#     # ===== Conditions =====
#     match_text_location_label = fields.Boolean(
#         default=True,
#         help="Search in the Statement's Label to find the Invoice/Payment's reference",
#     )
#     match_text_location_note = fields.Boolean(
#         default=False,
#         help="Search in the Statement's Note to find the Invoice/Payment's reference",
#     )
#     match_text_location_reference = fields.Boolean(
#         default=False,
#         help="Search in the Statement's Reference to find the Invoice/Payment's reference",
#     )
#     match_journal_ids = fields.Many2many('account.journal', string='Journals Availability',
#         domain="[('type', 'in', ('bank', 'cash'))]",
#         help='The reconciliation model will only be available from the selected journals.')
#     match_nature = fields.Selection(selection=[
#         ('amount_received', 'Amount Received'),
#         ('amount_paid', 'Amount Paid'),
#         ('both', 'Amount Paid/Received')
#     ], string='Amount Type', required=True, default='both',
#         help='''The reconciliation model will only be applied to the selected transaction type:
#         * Amount Received: Only applied when receiving an amount.
#         * Amount Paid: Only applied when paying an amount.
#         * Amount Paid/Received: Applied in both cases.''')
#     match_amount = fields.Selection(selection=[
#         ('lower', 'Is Lower Than'),
#         ('greater', 'Is Greater Than'),
#         ('between', 'Is Between'),
#     ], string='Amount Condition',
#         help='The reconciliation model will only be applied when the amount being lower than, greater than or between specified amount(s).')
#     match_amount_min = fields.Float(string='Amount Min Parameter')
#     match_amount_max = fields.Float(string='Amount Max Parameter')
#     match_label = fields.Selection(selection=[
#         ('contains', 'Contains'),
#         ('not_contains', 'Not Contains'),
#         ('match_regex', 'Match Regex'),
#     ], string='Label', help='''The reconciliation model will only be applied when the label:
#         * Contains: The proposition label must contains this string (case insensitive).
#         * Not Contains: Negation of "Contains".
#         * Match Regex: Define your own regular expression.''')
#     match_label_param = fields.Char(string='Label Parameter')
#     match_note = fields.Selection(selection=[
#         ('contains', 'Contains'),
#         ('not_contains', 'Not Contains'),
#         ('match_regex', 'Match Regex'),
#     ], string='Note', help='''The reconciliation model will only be applied when the note:
#         * Contains: The proposition note must contains this string (case insensitive).
#         * Not Contains: Negation of "Contains".
#         * Match Regex: Define your own regular expression.''')
#     match_note_param = fields.Char(string='Note Parameter')
#     match_transaction_type = fields.Selection(selection=[
#         ('contains', 'Contains'),
#         ('not_contains', 'Not Contains'),
#         ('match_regex', 'Match Regex'),
#     ], string='Transaction Type', help='''The reconciliation model will only be applied when the transaction type:
#         * Contains: The proposition transaction type must contains this string (case insensitive).
#         * Not Contains: Negation of "Contains".
#         * Match Regex: Define your own regular expression.''')
#     match_transaction_type_param = fields.Char(string='Transaction Type Parameter')
#     match_same_currency = fields.Boolean(string='Same Currency', default=True,
#         help='Restrict to propositions having the same currency as the statement line.')
#     allow_payment_tolerance = fields.Boolean(
#         string="Allow Payment Gap",
#         default=True,
#         help="Difference accepted in case of underpayment.",
#     )
#     payment_tolerance_param = fields.Float(
#         string="Gap",
#         default=0.0,
#         help="The sum of total residual amount propositions matches the statement line amount under this amount/percentage.",
#     )
#     payment_tolerance_type = fields.Selection(
#         selection=[('percentage', "in percentage"), ('fixed_amount', "in amount")],
#         required=True,
#         default='percentage',
#         help="The sum of total residual amount propositions and the statement line amount allowed gap type.",
#     )
#     match_partner = fields.Boolean(string='Partner Is Set',
#         help='The reconciliation model will only be applied when a customer/vendor is set.')
#     match_partner_ids = fields.Many2many('res.partner', string='Restrict Partners to',
#         help='The reconciliation model will only be applied to the selected customers/vendors.')
#     match_partner_category_ids = fields.Many2many('res.partner.category', string='Restrict Partner Categories to',
#         help='The reconciliation model will only be applied to the selected customer/vendor categories.')
#
#     line_ids = fields.One2many('account.reconcile.model.line.template', 'model_id')
#     decimal_separator = fields.Char(help="Every character that is nor a digit nor this separator will be removed from the matching string")
#
#
# class AccountReconcileModelLineTemplate(models.Model):
#     _name = "account.reconcile.model.line.template"
#     _description = 'Reconcile Model Line Template'
#
#     model_id = fields.Many2one('account.reconcile.model.template')
#     sequence = fields.Integer(required=True, default=10)
#     account_id = fields.Many2one('account.account.template', string='Account', ondelete='cascade', domain=[('deprecated', '=', False)])
#     label = fields.Char(string='Journal Item Label')
#     amount_type = fields.Selection([
#         ('fixed', 'Fixed'),
#         ('percentage', 'Percentage of balance'),
#         ('regex', 'From label'),
#     ], required=True, default='percentage')
#     amount_string = fields.Char(string="Amount")
#     force_tax_included = fields.Boolean(string='Tax Included in Price', help='Force the tax to be managed as a price included tax.')
#     tax_ids = fields.Many2many('account.tax.template', string='Taxes', ondelete='restrict')
# =======
# >>>>>>> 1eb2ebef96a ([REF] account: remove chart template)
