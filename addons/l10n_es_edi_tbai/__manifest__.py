# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

# Thanks to Landoo and the Spanish community
# Specially among others Aritz Olea, Luis Salvatierra, Josean Soroa
# TODO more thanks, add them to module description ?

{
    'name': "Spain - TicketBAI",
    'version': '1.0',
    'category': 'Accounting/Localizations/EDI',
    'application': False,
    'description': """
    This module sends invoices and vendor bills to the "Diputaciones
    Forales" of Araba/Álava, Bizkaia and Gipuzkoa.

    Invoices and bills get converted to XML and regularly sent to the
    Bask government servers which provides them with a unique identifier.
    A hash chain ensures the continuous nature of the invoice/bill
    sequences. QR codes are added to emitted (sent/printed) invoices,
    bills and tickets to allow anyone to check they have been declared.

    You need to configure your certificate and the tax agency.
    """,
    'depends': [
        'l10n_es',
        'account_edi'
    ],
    'data': [
        'data/account_edi_data.xml',
        'data/template_invoice.xml',

        'security/ir.model.access.csv',

        'views/account_move_view.xml',
        'views/l10n_es_tbai_certificate_views.xml',
        'views/res_config_settings_views.xml'
    ],
    'license': 'LGPL-3',
}
