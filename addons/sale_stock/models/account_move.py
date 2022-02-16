# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from collections import defaultdict

from odoo import fields, models
from odoo.tools import float_is_zero, float_compare, float_repr


class AccountMove(models.Model):
    _inherit = 'account.move'

    def _stock_account_get_last_step_stock_moves(self):
        """ Overridden from stock_account.
        Returns the stock moves associated to this invoice."""
        rslt = super(AccountMove, self)._stock_account_get_last_step_stock_moves()
        for invoice in self.filtered(lambda x: x.type == 'out_invoice'):
            rslt += invoice.mapped('invoice_line_ids.sale_line_ids.move_ids').filtered(lambda x: x.state == 'done' and x.location_dest_id.usage == 'customer')
        for invoice in self.filtered(lambda x: x.type == 'out_refund'):
            rslt += invoice.mapped('reversed_entry_id.invoice_line_ids.sale_line_ids.move_ids').filtered(lambda x: x.state == 'done' and x.location_id.usage == 'customer')
            # Add refunds generated from the SO
            rslt += invoice.mapped('invoice_line_ids.sale_line_ids.move_ids').filtered(lambda x: x.state == 'done' and x.location_id.usage == 'customer')
        return rslt

    def _get_invoiced_lot_values(self):
        """ Get and prepare data to show a table of invoiced lot on the invoice's report. """
        self.ensure_one()
        if self.state == 'draft' or not self.invoice_date or self.type not in ('out_invoice', 'out_refund'):
            return []

        amls = self.invoice_line_ids.filtered(lambda aml: not aml.display_type and aml.product_id and aml.quantity)
        write_dates = [wd for wd in amls.mapped('write_date') if wd]
        self_datetime = max(write_dates) if write_dates else None

        previous_amls = amls.sale_line_ids.invoice_lines.filtered(
            lambda aml: aml.move_id != self and aml.move_id.state not in ('draft', 'cancel')
                        and (self_datetime is None or aml.write_date <= self_datetime))

        previous_qties_invoiced = previous_amls._get_invoiced_qty_per_product()
        invoiced_qties = amls._get_invoiced_qty_per_product()
        invoiced_qties_copy = {**invoiced_qties}

        qties_per_lot = defaultdict(float)
        smls = amls.sale_line_ids.move_ids.move_line_ids.filtered(lambda sml: sml.state == 'done' and sml.lot_id).sorted(lambda sml: (sml.date, sml.id))
        for sml in smls.filtered(lambda sml: sml.product_id in invoiced_qties.keys()):
            product_uom = sml.product_id.uom_id
            qty_done = sml.product_uom_id._compute_quantity(sml.qty_done, product_uom)

            previous_qty_invoiced = previous_qties_invoiced.get(sml.product_id, 0)
            if float_compare(previous_qty_invoiced, 0, precision_rounding=product_uom.rounding) > 0:
                if float_compare(qty_done, previous_qty_invoiced, precision_rounding=product_uom.rounding) > 0:
                    qties_per_lot[sml.lot_id] += qty_done - previous_qty_invoiced

                if sml.location_id.usage == 'customer':
                    previous_qties_invoiced[sml.product_id] += qty_done
                elif sml.location_dest_id.usage == 'customer':
                    previous_qties_invoiced[sml.product_id] -= qty_done

            elif float_compare(invoiced_qties[sml.product_id], 0, precision_rounding=product_uom.rounding) > 0:
                if sml.location_id.usage == 'customer':
                    invoiced_qties[sml.product_id] += qty_done
                elif sml.location_dest_id.usage == 'customer':
                    invoiced_qties[sml.product_id] -= qty_done
                qties_per_lot[sml.lot_id] += qty_done

        lot_values = []
        dp = self.env['decimal.precision'].precision_get('Product Unit of Measure')
        invoiced_qties = invoiced_qties_copy
        for lot, qty in qties_per_lot.items():
            if float_is_zero(invoiced_qties[lot.product_id], precision_rounding=lot.product_uom_id.rounding):
                continue
            invoiced_lot_qty = min(qty, invoiced_qties[lot.product_id])
            invoiced_qties[lot.product_id] -= invoiced_lot_qty
            lot_values.append({
                'product_name': lot.product_id.display_name,
                'quantity': float_repr(invoiced_lot_qty, precision_digits=dp),
                'uom_name': lot.product_uom_id.name,
                'lot_name': lot.name,
                # The lot id is needed by localizations to inherit the method and add custom fields on the invoice's report.
                'lot_id': lot.id,
            })

        return lot_values


class AccountMoveLine(models.Model):
    _inherit = "account.move.line"

    def _sale_can_be_reinvoice(self):
        self.ensure_one()
        return not self.is_anglo_saxon_line and super(AccountMoveLine, self)._sale_can_be_reinvoice()


    def _stock_account_get_anglo_saxon_price_unit(self):
        self.ensure_one()
        price_unit = super(AccountMoveLine, self)._stock_account_get_anglo_saxon_price_unit()

        so_line = self.sale_line_ids and self.sale_line_ids[-1] or False
        if so_line:
            is_line_reversing = bool(self.move_id.reversed_entry_id)
            qty_to_invoice = self.product_uom_id._compute_quantity(self.quantity, self.product_id.uom_id)
            posted_invoice_lines = so_line.invoice_lines.filtered(lambda l: l.move_id.state == 'posted' and bool(l.move_id.reversed_entry_id) == is_line_reversing)
            qty_invoiced = sum([x.product_uom_id._compute_quantity(x.quantity, x.product_id.uom_id) for x in posted_invoice_lines])

            average_price_unit = self.product_id.with_context(force_company=self.company_id.id, is_returned=is_line_reversing)._compute_average_price(qty_invoiced, qty_to_invoice, so_line.move_ids)
            price_unit = average_price_unit or price_unit
            price_unit = self.product_id.uom_id.with_context(force_company=self.company_id.id)._compute_price(price_unit, self.product_uom_id)
        return price_unit
