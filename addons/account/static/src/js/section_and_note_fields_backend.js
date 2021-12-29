
odoo.define('account.section_and_note_backend', function (require) {
// The goal of this file is to contain JS hacks related to allowing
// section and note on sale order and invoice.

// [UPDATED] now also allows configuring products on sale order.

"use strict";
var FieldChar = require('web.basic_fields').FieldChar;
var FieldOne2Many = require('web.relational_fields').FieldOne2Many;
var fieldRegistry = require('web.field_registry');
var ListFieldText = require('web.basic_fields').ListFieldText;
var ListRenderer = require('web.ListRenderer');

var SectionAndNoteListRenderer = ListRenderer.extend({
    /**
     * We want the header of section and note to be invisible,
     * as with the rows in the table, the section and note field
     * should not be visible.
     *
     * @override
    **/
    _renderHeaderCell: function(node) {
        var $th = this._super.apply(this, arguments);

        var isAccountModel =  this.state.id.startsWith("account.move.line");
        var isSaleModel =  this.state.id.startsWith("sale.order.line");
        var isSectionNote = node.attrs.name === "name_section_note";
        var isProduct = node.attrs.name === "product_id"
            || node.attrs.name === "product_template_id";
        var isLabel = node.attrs.name === "name";

        if (isSectionNote) {
            $th.removeClass('o_invisible_modifier');
            return $th.addClass('o_hidden');
        } else if (isProduct && isSaleModel) {
            $th.attr('colspan', 2)
            return $th;
        } else if (isLabel && isAccountModel) {
            $th.attr('colspan', 2)
            return $th;
        }

        return $th;
    },

    /**
     * We want section and note to take the whole line (except handle and trash)
     * to look better and to hide the unnecessary fields.
     *
     * @override
     */
    _renderBodyCell: function (record, node, index, options) {

        var $cell = this._super.apply(this, arguments);

        var isSection = record.data.display_type === 'line_section';
        var isNote = record.data.display_type === 'line_note';
        var isProduct = record.data.display_type === false;

        var isAccountModel = record.model === "account.move.line";
        var isSaleModel = record.model === "sale.order.line";

        if (isSection || isNote) {
            if (node.attrs.widget === "handle") {
                return $cell;
            } else if (node.attrs.name === "name_section_note") {
                var nbrColumns = this._getNumberOfCols();
                if (this.handleField) {
                    nbrColumns--;
                }
                if (this.addTrashIcon) {
                    nbrColumns--;
                }

                var columns = this.columns.map(function (obj) {return obj.attrs.name});
                if (columns.includes("product_id") && columns.includes("product_template_id")) {
                    nbrColumns++;
                }

                $cell.attr('colspan', nbrColumns);
            } else {
                $cell.removeClass('o_invisible_modifier');
                return $cell.addClass('o_hidden');
            }
        } else if (isProduct) {
            if (node.attrs.widget === "handle") {
                return $cell;
            } else if (node.attrs.name === "name_section_note") {
                $cell.removeClass('o_invisible_modifier');
                return $cell.addClass('o_hidden');
            } else if ((node.attrs.name === "product_id"
                || node.attrs.name === "product_template_id") && isSaleModel) {
                $cell.attr('colspan', 2)
            } else if (node.attrs.name === "name" && isAccountModel) {
                $cell.attr('colspan', 2)
            }

            return $cell;
        }

        return $cell;
    },
    /**
     * We add the o_is_{display_type} class to allow custom behaviour both in JS and CSS.
     *
     * @override
     */
    _renderRow: function (record, index) {
        var $row = this._super.apply(this, arguments);

        if (record.data.display_type) {
            $row.addClass('o_is_' + record.data.display_type);
        }

        return $row;
    },
    /**
     * We want to add .o_section_and_note_list_view on the table to have stronger CSS.
     *
     * @override
     * @private
     */
    _renderView: function () {
        var self = this;
        return this._super.apply(this, arguments).then(function () {
            self.$('.o_list_table').addClass('o_section_and_note_list_view');
        });
    }
});

// We create a custom widget because this is the cleanest way to do it:
// to be sure this custom code will only impact selected fields having the widget
// and not applied to any other existing ListRenderer.
var SectionAndNoteFieldOne2Many = FieldOne2Many.extend({
    /**
     * We want to use our custom renderer for the list.
     *
     * @override
     */
    _getRenderer: function () {
        if (this.view.arch.tag === 'tree') {
            return SectionAndNoteListRenderer;
        }
        return this._super.apply(this, arguments);
    },
});

// This is a merge between a FieldText and a FieldChar.
// We want a FieldChar for section,
// and a FieldText for the rest (product and note).
var SectionAndNoteFieldText = function (parent, name, record, options) {
    var isSection = record.data.display_type === 'line_section';
    var Constructor = isSection ? FieldChar : ListFieldText;
    return new Constructor(parent, name, record, options);
};

fieldRegistry.add('section_and_note_one2many', SectionAndNoteFieldOne2Many);
fieldRegistry.add('section_and_note_text', SectionAndNoteFieldText);

return SectionAndNoteListRenderer;
});
