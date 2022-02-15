/* @odoo-module */

import Popover from "web.Popover";
import { LegacyComponent } from "@web/legacy/legacy_component";

const { Component } = owl;

export class TimeOffCardPopover extends LegacyComponent {}
TimeOffCardPopover.components = { Popover };

TimeOffCardPopover.template = 'hr_holidays.TimeOffCardPopover';
TimeOffCardPopover.props = ['allocated', 'approved', 'planned', 'left'];

export class TimeOffCard extends LegacyComponent {}

TimeOffCard.components = { TimeOffCardPopover };
TimeOffCard.template = 'hr_holidays.TimeOffCard';
TimeOffCard.props = ['name', 'id', 'data', 'requires_allocation'];

export class TimeOffCardMobile extends TimeOffCard {}

TimeOffCardMobile.template = 'hr_holidays.TimeOffCardMobile';
