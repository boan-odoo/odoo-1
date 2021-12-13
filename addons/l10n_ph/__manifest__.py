{
    "name": "The Philippines - Accounting",
    "summary": """
        This is the module to manage the accounting chart for The Philippines.
        """,
    "category": "Accounting/Localizations/Account Charts",
    "version": "14.0.1.0.0",
    "author": "Odoo PS",
    "website": "https://www.odoo.com",
    "license": "OEEL-1",
    "depends": [
        "account_accountant",
        "contacts",
    ],
    "data": [
        "data/account_chart_template_data.xml",
        "data/account.account.template.csv",
        "data/account_chart_template_post_data.xml",
        "data/account_tax_group.xml",
        "data/account_tax_template.xml",
        "data/account_fiscal_position_template.xml",
        "data/account_fiscal_position_tax_template.xml",
        "data/account_chart_template_configure_data.xml",
        "views/account_tax_views.xml",
    ],
}
