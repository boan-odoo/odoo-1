# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo.tests import HttpCase
from odoo.tests.common import tagged


@tagged('post_install', '-at_install')
class TestWebsiteEventBoothSale(HttpCase):

    def test_tour(self):
        self.start_tour('/event', 'website_event_booth_tour', login='portal')
