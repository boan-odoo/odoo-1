# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo.tests import Form, users
from odoo.exceptions import AccessError
from odoo.addons.mail.tests.common import MailCommon


class TestMailTemplate(MailCommon):
    @classmethod
    def setUpClass(cls):
        super(TestMailTemplate, cls).setUpClass()
        # Enable the Jinja rendering restriction
        cls.env['ir.config_parameter'].set_param('mail.restrict.template.rendering', True)
        cls.user_employee.groups_id -= cls.env.ref('mail.group_mail_template_editor')

        cls.mail_template = cls.env['mail.template'].create({
            'name': 'Test template',
            'subject': '{{ 1 + 5 }}',
            'body_html': '<t t-out="4 + 9"/>',
            'lang': '{{ object.lang }}',
            'auto_delete': True,
            'model_id': cls.env.ref('base.model_res_partner').id,
        })

    @users('employee')
    def test_mail_compose_message_content_from_template(self):
        form = Form(self.env['mail.compose.message'])
        form.template_id = self.mail_template
        mail_compose_message = form.save()

        self.assertEqual(mail_compose_message.subject, '6', 'We must trust mail template values')

    @users('employee')
    def test_mail_compose_message_content_from_template_mass_mode(self):
        mail_compose_message = self.env['mail.compose.message'].create({
            'composition_mode': 'mass_mail',
            'model': 'res.partner',
            'template_id': self.mail_template.id,
            'subject': '{{ 1 + 5 }}',
        })

        values = mail_compose_message.get_mail_values(self.partner_employee.ids)

        self.assertEqual(values[self.partner_employee.id]['subject'], '6', 'We must trust mail template values')
        self.assertIn('13', values[self.partner_employee.id]['body_html'], 'We must trust mail template values')

    def test_mail_template_acl(self):
        # Sanity check
        self.assertTrue(self.user_admin.has_group('mail.group_mail_template_editor'))
        self.assertFalse(self.user_employee.has_group('mail.group_mail_template_editor'))

        # Group System can create / write / unlink mail template
        mail_template = self.env['mail.template'].with_user(self.user_admin).create({'name': 'Test template'})
        self.assertEqual(mail_template.name, 'Test template')

        mail_template.with_user(self.user_admin).name = 'New name'
        self.assertEqual(mail_template.name, 'New name')

        # Standard employee can not
        with self.assertRaises(AccessError):
            self.env['mail.template'].with_user(self.user_employee).create({})

        with self.assertRaises(AccessError):
            mail_template.with_user(self.user_employee).name = 'Test write'

    def test_mail_template_access(self):
        self.user_employee.groups_id += self.env.ref('mail.group_mail_template_editor')
        user_template = self.env['mail.template'].with_user(self.user_employee).create({
            'name': 'Test template',
            'subject': '{{ 1 + 5 }}',
            'body_html': '<t t-out="4 + 9"/>',
            'lang': '{{ object.lang }}',
            'auto_delete': True,
            'model_id': self.env.ref('base.model_res_partner').id,
        })
        admin_template = self.env['mail.template'].create({
            'name': 'Test template',
            'subject': '{{ 1 + 5 }}',
            'body_html': '<t t-out="4 + 9"/>',
            'lang': '{{ object.lang }}',
            'auto_delete': True,
            'model_id': self.env.ref('base.model_res_partner').id,
        })

        # Standard employee can modify their own template
        user_template.with_user(self.user_employee).write({
            'name': 'Test template write',
        })
        self.assertEqual(user_template['name'], 'Test template write')

        # Standard employee cannot modify other's template
        with self.assertRaises(AccessError):
            admin_template.with_user(self.user_employee).write({
                'name': 'Test template write',
            })

        # Admin employee can modify their own template
        admin_template.with_user(self.user_admin).write({
            'name': 'Test template write 2',
        })
        self.assertEqual(admin_template['name'], 'Test template write 2')

        # Admin employee can modify other's template
        user_template.with_user(self.user_admin).write({
            'name': 'Test template write 2',
        })
        self.assertEqual(user_template['name'], 'Test template write 2')
