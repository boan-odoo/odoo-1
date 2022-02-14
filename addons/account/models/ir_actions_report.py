# -*- coding: utf-8 -*-

import base64
import io
import math

from PIL import Image
from PyPDF2 import PdfFileWriter, PdfFileReader
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from odoo import models, _
from odoo.exceptions import UserError
from odoo.tools import file_open


class IrActionsReport(models.Model):
    _inherit = 'ir.actions.report'

    @staticmethod
    def _rotate_coordinates(x, y, degrees):
        """ Rotate a point (x, y) around the origin (0, 0). """

        radians = math.radians(degrees)
        xx = x * math.cos(radians) + y * math.sin(radians)
        yy = -x * math.sin(radians) + y * math.cos(radians)

        return xx, yy

    def _add_banner_with_reference(self, record):
        """ Modify the current PDF file in order to add a banner, in the upper right corner,
            that will include the Vendor Bill's 'name'. This is mostly done for auditing purposes.
        """

        file = io.BytesIO(base64.b64decode(record.message_main_attachment_id.datas))
        old_pdf = PdfFileReader(file, strict=False, overwriteWarnings=False)
        old_pdf.getNumPages()
        packet = io.BytesIO()
        can = canvas.Canvas(packet)
        logo = Image.open(file_open('base/static/img/main_partner-image.png', mode='rb'))  # Odoo logo
        r, g, b = (113, 75, 103)  # Odoo color

        for p in range(0, old_pdf.getNumPages()):
            page = old_pdf.getPage(p)
            width = float(abs(page.mediaBox.getWidth()))
            height = float(abs(page.mediaBox.getHeight()))

            # Draw banner in upper right corner
            can.setStrokeColorRGB(r / 255, g / 255, b / 255)
            can.setFillColorRGB(r / 255, g / 255, b / 255)
            p = can.beginPath()
            p.moveTo(width - 5 * cm, height)
            p.lineTo(width - 3 * cm, height)
            p.lineTo(width, height - 3 * cm)
            p.lineTo(width, height - 5 * cm)
            p.lineTo(width - 5 * cm, height)
            can.drawPath(p, fill=1)

            # Rotate canvas and insert Vendor Bill reference
            can.saveState()
            can.rotate(-45)
            can.setFontSize(10)
            can.setStrokeColor(colors.white)
            can.setFillColor(colors.white)
            x_str, y_str = self._rotate_coordinates(width - 1 * cm, height - 3 * cm, -45)
            can.drawRightString(x_str, y_str, record.name)
            x_img, y_img = self._rotate_coordinates(width - 2 * cm, height - 3.5 * cm, -45)
            can.drawImage(ImageReader(logo), x_img, y_img, 40, 40, mask='auto', preserveAspectRatio=True)
            can.restoreState()

            can.showPage()

        can.save()
        item_pdf = PdfFileReader(packet, overwriteWarnings=False)
        new_pdf = PdfFileWriter()

        for p in range(0, old_pdf.getNumPages()):
            page = old_pdf.getPage(p)
            page.mergePage(item_pdf.getPage(p))
            new_pdf.addPage(page)

        output = io.BytesIO()
        new_pdf.write(output)
        attachment = record.message_main_attachment_id.copy()
        attachment.datas = base64.b64encode(output.getvalue())
        output.close()

        return attachment

    def retrieve_attachment(self, record):
        # get the original bills through the message_main_attachment_id field of the record
        if self.report_name == 'account.report_original_vendor_bill' and record.message_main_attachment_id:

            # Add a banner with the Vendor Bill name when exporting the PDFs
            if record.message_main_attachment_id.mimetype == 'application/pdf':
                return self._add_banner_with_reference(record)

            if record.message_main_attachment_id.mimetype.startswith('image'):
                return record.message_main_attachment_id
        return super(IrActionsReport, self).retrieve_attachment(record)

    def _post_pdf(self, save_in_attachment, pdf_content=None, res_ids=None):
        # don't include the generated dummy report
        if self.report_name == 'account.report_original_vendor_bill':
            pdf_content = None
            res_ids = None
            if not save_in_attachment:
                raise UserError(_("No original vendor bills could be found for any of the selected vendor bills."))
        return super(IrActionsReport, self)._post_pdf(save_in_attachment, pdf_content=pdf_content, res_ids=res_ids)

    def _postprocess_pdf_report(self, record, buffer):
        # don't save the 'account.report_original_vendor_bill' report as it's just a mean to print existing attachments
        if self.report_name == 'account.report_original_vendor_bill':
            return None
        res = super(IrActionsReport, self)._postprocess_pdf_report(record, buffer)
        if self.model == 'account.move' and record.state == 'posted' and record.is_sale_document(include_receipts=True):
            attachment = self.retrieve_attachment(record)
            if attachment:
                attachment.register_as_main_attachment(force=False)
        return res

    def _render_qweb_pdf(self, res_ids=None, data=None):
        # Overridden so that the print > invoices actions raises an error
        # when trying to print a miscellaneous operation instead of an invoice.
        if self.model == 'account.move' and res_ids:
            invoice_reports = (self.env.ref('account.account_invoices_without_payment'), self.env.ref('account.account_invoices'))
            if self in invoice_reports:
                moves = self.env['account.move'].browse(res_ids)
                if any(not move.is_invoice(include_receipts=True) for move in moves):
                    raise UserError(_("Only invoices could be printed."))

        return super()._render_qweb_pdf(res_ids=res_ids, data=data)
