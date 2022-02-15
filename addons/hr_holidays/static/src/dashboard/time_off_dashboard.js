/* @odoo-module */

import { TimeOffCard } from './time_off_card';
import { LegacyComponent } from "@web/legacy/legacy_component";

const { Component } = owl;

export class TimeOffDashboard extends LegacyComponent {}

TimeOffDashboard.components = { TimeOffCard };
TimeOffDashboard.template = 'hr_holidays.TimeOffDashboard';
TimeOffDashboard.props = ['holidays'];
