/** @odoo-module **/

import { registry } from "@web/core/registry";
import { _lt } from "@web/core/l10n/translation";
import { standardFieldProps } from "./standard_field_props";

import { Dropdown } from "@web/core/dropdown/dropdown";
import { DropdownItem } from "@web/core/dropdown/dropdown_item";

const { Component, useState } = owl;

export class Many2ManyTagsField extends Component {
    setup() {
        this.state = useState({
            isOpen: false,
        });
    }
    get tags() {
        const colorField = this.props.colorField;
        return this.props.value.records
            .filter((record) => !colorField || record.data[colorField])
            .map((record, i) => ({
                id: record.data.id,
                name: record.data.display_name,
                colorIndex: record.data[colorField] || i,
            }));
    }

    onClick() {
        this.state.isOpen = !this.state.isOpen;
    }
}

Many2ManyTagsField.components = {
    Dropdown,
    DropdownItem,
};
Many2ManyTagsField.template = "web.Many2ManyTagsField";
Many2ManyTagsField.props = {
    ...standardFieldProps,
    placeholder: { type: String, optional: true },
    colorField: { type: String, optional: true },
};
Many2ManyTagsField.displayName = _lt("Tags");
Many2ManyTagsField.supportedTypes = ["many2many"];
Many2ManyTagsField.fieldsToFetch = {
    display_name: { name: "display_name", type: "char" },
};
Many2ManyTagsField.convertAttrsToProps = (attrs) => {
    return {
        colorField: attrs.options.color_field,
    };
};

registry.category("fields").add("many2many_tags", Many2ManyTagsField);
