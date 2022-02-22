# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo.addons.sale_project.tests.test_project_profitability import TestSaleProjectProfitabilityCommon
from .common import TestCommonSaleTimesheet


class TestSaleTimesheetProjectProfitabilityCommon(TestSaleProjectProfitabilityCommon, TestCommonSaleTimesheet):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()


class TestSaleTimesheetProjectProfitability(TestSaleTimesheetProjectProfitabilityCommon):
    def test_profitability_of_non_billable_project(self):
        """ Test no data is found for the project profitability since the project is not billable
            even if it is linked to a sale order items.
        """
        self.assertFalse(self.project.allow_billable)
        self.assertDictEqual(
            self.project._get_profitability_items(False),
            self.project_profitability_empty,
        )
        self.project.sale_line_id = self.order_service_1_order_line
        self.assertDictEqual(
            self.project._get_profitability_items(False),
            self.project_profitability_empty,
            "Even if the project has a sale order item linked the project profitability should not be computed since it is not billable."
        )

    def test_get_project_profitability_items(self):
        """ Test _get_project_profitability_items method to ensure the project profitability
            is correctly computed as expected.
        """
        self.project.allow_billable = True
        self.task.sale_line_id = self.order_service_1_order_line
        self.assertDictEqual(
            self.project._get_profitability_items(False),
            self.project_profitability_empty,
            'No timesheets has been recorded in the task and no product has been deelivered in the SO linked so the project profitability has no data found.'
        )

        timesheets = self.env['account.analytic.line'].create([
            {'name': 'Timesheet 1', 'employee_id': self.employee_user.id, 'unit_amount': 3.0},
            {'name': 'Timesheet 2', 'employee_id': self.employee_user.id, 'unit_amount': 2.0},
        ])
