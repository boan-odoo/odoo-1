/** @odoo-module **/

import { registry } from "@web/core/registry";
import { _lt } from "@web/core/l10n/translation";
import { standardFieldProps } from "./standard_field_props";

const { Component } = owl;

export class SelectionField extends Component {
    get options() {
        switch (this.props.type) {
            case "many2one":
                return this.props.record.preloadedData[this.props.name];
            case "selection":
                return this.props.record.fields[this.props.name].selection;
            default:
                return [];
        }
    }
    get string() {
        switch (this.props.type) {
            case "many2one":
                return this.props.value ? this.props.value[1] : "";
            case "selection":
                return this.props.value !== false
                    ? this.options.find((o) => o[0] === this.props.value)[1]
                    : "";
            default:
                return "";
        }
    }
    get value() {
        debugger;
        const rawValue = this.props.value;
        return this.props.type === "many2one" && rawValue ? rawValue[0] : rawValue;
    }

    stringify(value) {
        return JSON.stringify(value);
    }

    /**
     * @param {Event} ev
     */
    onChange(ev) {
        const value = JSON.parse(ev.target.value);
        switch (this.props.type) {
            case "many2one":
                if (value === false) {
                    this.props.update(false);
                } else {
                    this.props.update(this.options.find((option) => option[0] === value));
                }
                break;
            case "selection":
                this.props.update(value);
                break;
        }
    }
}

SelectionField.template = "web.SelectionField";
SelectionField.props = {
    ...standardFieldProps,
    placeholder: { type: String, optional: true },
};
SelectionField.displayName = _lt("Selection");
SelectionField.supportedTypes = ["many2one", "selection"];
SelectionField.isEmpty = (record, fieldName) => record.data[fieldName] === false;

registry.category("fields").add("selection", SelectionField);

export function preloadSelection(orm, datapoint, fieldName) {
    const field = datapoint.fields[fieldName];
    if (field.type !== "many2one") {
        return Promise.resolve();
    }

    const context = datapoint.evalContext;
    const domain = datapoint.getFieldDomain(fieldName).toList(context);

    return orm.call(field.relation, "name_search", ["", domain]);
}

registry.category("preloadedData").add("selection", preloadSelection);
