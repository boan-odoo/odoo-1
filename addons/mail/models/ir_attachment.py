# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
import requests

from lxml import html
from odoo import models, api, fields
from odoo.exceptions import AccessError
from odoo.http import request
from odoo.tools import image_process
from dateutil.relativedelta import relativedelta
from datetime import datetime

class IrAttachment(models.Model):
    _inherit = 'ir.attachment'

    def _post_add_create(self):
        """ Overrides behaviour when the attachment is created through the controller
        """
        super(IrAttachment, self)._post_add_create()
        for record in self:
            record.register_as_main_attachment(force=False)

    def register_as_main_attachment(self, force=True):
        """ Registers this attachment as the main one of the model it is
        attached to.
        """
        self.ensure_one()
        if not self.res_model:
            return
        related_record = self.env[self.res_model].browse(self.res_id)
        if not related_record.check_access_rights('write', raise_exception=False):
            return
        # message_main_attachment_id field can be empty, that's why we compare to False;
        # we are just checking that it exists on the model before writing it
        if related_record and hasattr(related_record, 'message_main_attachment_id'):
            if force or not related_record.message_main_attachment_id:
                #Ignore AccessError, if you don't have access to modify the document
                #Just don't set the value
                try:
                    related_record.message_main_attachment_id = self
                except AccessError:
                    pass

    def _delete_and_notify(self):
        for attachment in self:
            if attachment.res_model == 'mail.channel' and attachment.res_id:
                target = self.env['mail.channel'].browse(attachment.res_id)
            else:
                target = self.env.user.partner_id
            self.env['bus.bus']._sendone(target, 'ir.attachment/delete', {
                'id': attachment.id,
            })
        self.unlink()

    def _attachment_format(self, commands=False):
        safari = request and request.httprequest.user_agent and request.httprequest.user_agent.browser == 'safari'
        attachments = []
        for attachment in self:
            res = {
                'checksum': attachment.checksum,
                'description': attachment.description,
                'id': attachment.id,
                'filename': attachment.name,
                'name': attachment.name,
                'mimetype': 'application/octet-stream' if safari and attachment.mimetype and 'video' in attachment.mimetype else attachment.mimetype,
                'url': attachment.url,
            }
            if commands:
                res['originThread'] = [('insert', {
                    'id': attachment.res_id,
                    'model': attachment.res_model,
                })]
            else:
                res.update({
                    'res_id': attachment.res_id,
                    'res_model': attachment.res_model,
                })
            attachments.append(res)
        return attachments

    @api.model
    def _get_data_from_url(self, url):
        """
        This will create attachment data based on what we can read from the URL.
        If the URL is an HTML page, this will parse the OpenGraph meta data.
        If the URL is an image, this will create an image attachment.
        """
        try:
            page = requests.get(url, timeout=1)
        except requests.exceptions.RequestException:
            return False

        if page.status_code != requests.codes.ok:
            return False

        image_mimetype = [
            'image/bmp',
            'image/gif',
            'image/jpeg',
            'image/png',
            'image/tiff',
            'image/x-icon',
        ]
        if page.headers['Content-Type'] in image_mimetype:
            return self._get_data_from_url_image(url)
        elif 'text/html' in page.headers['Content-Type']:
            return self._get_data_from_url_html(url, page.content)
        return False

    def _get_data_from_url_image(self, url):
        image = self._get_image_from_url(url)
        data = {
            'url': url,
            'name': url,
            'description': False,
            'raw': image,
            'mimetype': 'image/o-linkpreview-image',
        }
        return data

    def _get_image_from_url(self, image_url):
        request_image = False
        image = False
        try:
            request_image = requests.get(image_url, timeout=1)
        except requests.exceptions.RequestException:
            request_image = False
        if request_image and request_image.status_code != requests.codes.ok:
            return False
        if (request_image):
            image = image_process(
                request_image.content,
                size=(300, 300),
                verify_resolution=True
            )
        return image

    def _get_data_from_url_html(self, url, content):
        tree = html.fromstring(content)
        title = tree.xpath('//meta[@property="og:title"]/@content')
        if title:
            image_url = tree.xpath('//meta[@property="og:image"]/@content')
            image = False
            if image_url:
                image = self._get_image_from_url(image_url[0])
            description = tree.xpath('//meta[@property="og:description"]/@content')
            data = {
                'url': url,
                'name': title[0] if title else url,
                'raw': image if image else False,
                'description': description[0] if description else False,
                'mimetype': 'application/o-linkpreview-with-thumbnail' if image else 'application/o-linkpreview',
            }
            return data
        return False

    @api.autovacuum
    def _gc_link_preview(self):
        mimetypes = [
            'application/o-linkpreview',
            'image/o-linkpreview-image',
            'application/o-linkpreview-with-thumbnail',
        ]
        date_to_delete = fields.Date.to_string((datetime.now() + relativedelta(days=-7)))
        domain = [
            ('mimetype', 'in', mimetypes),
            ('write_date', '<', date_to_delete)
        ]
        records = self.sudo().search(domain)
        for record in records:
            # Delete the data but save the mimetype for futur use
            record.sudo().write({ 'raw': False, 'mimetype': record.mimetype })
