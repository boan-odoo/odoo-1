# -*- coding: utf-8 -*-
from __future__ import print_function
import json
import logging

from ast import literal_eval
from lxml import etree
from markupsafe import escape

from odoo import models
from odoo.tools.misc import str2bool

from odoo.addons.base.models.ir_qweb import VOID_ELEMENTS

_logger = logging.getLogger(__name__)


class IrQWebJs(models.AbstractModel):
    _name = 'ir.qweb.js'
    _inherit = 'ir.qweb'
    _description = 'Qweb JS'

    def _rename_qweb_js_directives(self, el):
        # t-if, t-att, ... meant for the qweb js directly. Ignore them.
        for child in el.iterdescendants():
            for attribute in list(child.attrib):
                if attribute.startswith('t-'):
                    child.set(f"qweb-js-{attribute}", child.attrib.pop(attribute))

    def _get_template(self, template, options):
        if isinstance(template, etree._Element):
            self._rename_qweb_js_directives(template)
        element, document, ref = super()._get_template(template, options)
        element.set('t-model', options['model'])
        if not isinstance(template, etree._Element):
            self._rename_qweb_js_directives(element)
        return (element, document, ref)

    def _prepare_values(self, values, options):
        # e.g readonly="context.get('default_survey_id')"
        values['context'] = values['env'].context
        return values

    def _is_static_node(self, el, options):
        return not any(att.startswith('t-') for att in el.attrib)

    def _compile_node(self, el, options, level):
        def _set_model(model, options):
            model = self.env[model].sudo()
            fields = model.fields_get()
            fields = {field.get('name'): fields[field.get('name')] for field in el.xpath('.//field[not(ancestor::field[position() = 2])]') if field.get('name') in fields}

            field_nodes = {}
            def collect(node, model):
                if node.tag == 'field':
                    field = model._fields.get(node.get('name'))
                    if field:
                        field_nodes.setdefault(field, []).append(node)
                        if field.relational:
                            model = self.env[field.comodel_name]
                for child in node:
                    collect(child, model)

            collect(el, model)

            return dict(options, model=model, fields=fields, field_nodes=field_nodes)

        if el.get('t-model'):
            options = _set_model(el.attrib.pop('t-model'), options)

        model = options['model']

        modifiers = {}

        if el.tag == 'field':
            fields = options['fields']
            fname = el.attrib.get('name')
            field = fields.get(fname) or {}

            for attribute in ['invisible', 'readonly', 'required']:
                if field.get(attribute):
                    modifiers[attribute] = True

            if field.get('states'):
                state_exceptions = {}
                for state, modifs in field.get("states", {}).items():
                    for attribute, value in modifs:
                        if modifiers.get(attribute) != value:
                            state_exceptions.setdefault(attribute, []).append(state)
                for attribute, states in state_exceptions.items():
                    modifiers[attribute] = [("state", "not in" if modifiers.get(attribute) else "in", states)]

            if fname in model._fields and model._has_onchange(model._fields[fname], options['field_nodes']):
                el.set('on_change', '1')

            if field.get('type') in ('many2one', 'many2many'):
                for method in ['create', 'write']:
                    el.set(f't-att-can_{method}', f"'true' if env['{field.get('relation')}'].sudo(False).check_access_rights('{method}', raise_exception=False) else 'false'")

            if field.get('groups'):
                el.set("t-if", f"env.user.user_has_groups({repr(field.get('groups'))})")

            if el.getchildren():
                fname = el.get('name')
                field = model._fields[fname]
                for child_view in el.xpath("./*[descendant::field]"):
                    child_view.set("t-model", field.comodel_name)

        elif el.tag == 'label' and el.attrib.get('for') in options['fields']:
            fname = el.attrib.get('for')
            field = options['fields'].get(fname)
            if field.get('groups'):
                el.set("t-if", f"env.user.user_has_groups({repr(field.get('groups'))})")

        elif el.tag in ('kanban', 'tree', 'form', 'activity'):
            for action, operation in (('create', 'create'), ('delete', 'unlink'), ('edit', 'write')):
                if (not el.get(action)):
                    el.set(f't-att-{action}', f"'false' if not env['{model._name}'].sudo(False).check_access_rights('{operation}', raise_exception=False) or not env.context.get(action, True) else None")

        elif el.tag == 'groupby':
            fname = el.get('name')
            field = model._fields[fname]
            options = _set_model(field.comodel_name, options)

        if el.get('attrs'):
            attrs = el.get('attrs').strip()
            modifiers.update(literal_eval(attrs))

        if el.get('states'):
            modifiers['invisible'] = [("state", "not in", el.get('states').split(','))]

        for attribute in ['invisible', 'readonly', 'required']:
            if el.get(attribute):
                try:
                    modifier = str2bool(el.get(attribute).lower())
                except ValueError:
                    # e.g. context.get('default_survey_id')
                    el.set(f't-att-{attribute}', el.attrib.pop(attribute))
                    modifier = False
                if modifier:
                    # TODO: check if this cannot be simplified
                    if (attribute == 'invisible'
                            and any(parent.tag == 'tree' for parent in el.iterancestors())
                            and not any(parent.tag == 'header' for parent in el.iterancestors())):
                        # Invisible in a tree view has a specific meaning, make it a
                        # new key in the modifiers attribute.
                        modifiers['column_invisible'] = True
                    else:
                        modifiers[attribute] = True
                else:
                    modifiers.pop(attribute, None)

        if el.get('groups'):
            groups = el.attrib.pop('groups')
            el.set('t-att-invisible', f"'1' if not env.user.user_has_groups({repr(groups)}) else None")
            # avoid making field visible later
            # e.g.
            # <button groups="event.group_event_user" type="object" attrs="{'invisible': [('event_count','=', 0)]}">
            #   <field name="event_count"/>
            # </button>
            el.set('t-att-modifiers', f"{json.dumps(modifiers)!r} if env.user.user_has_groups({repr(groups)}) else {json.dumps(dict(modifiers, invisible=True))!r}")
        elif modifiers:
            el.set('modifiers', json.dumps(modifiers))

        return super()._compile_node(el, options, level)

    def _compile_static_node(self, el, options, level):
        """ Compile a purely static element into a list of string. """
        unqualified_el_tag = el_tag = el.tag
        attrib = self._post_processing_att(el.tag, el.attrib, options)

        attributes = ''.join(f' {name}="{escape(str(value))}"'
                            for name, value in attrib.items() if value or isinstance(value, str))
        self._append_text(f'<{el_tag}{"".join(attributes)}', options)
        if unqualified_el_tag in list(VOID_ELEMENTS):
            self._append_text('/>', options)
        else:
            self._append_text('>', options)

        el.attrib.clear()

        body = self._compile_directive(el, options, 'inner-content', level)

        if unqualified_el_tag not in list(VOID_ELEMENTS):
            self._append_text(f'</{el_tag}>', options)

        return body

    def _post_processing_att(self, tagName, atts, options):
        atts = super()._post_processing_att(tagName, atts, options)
        for attribute in list(atts):
            if attribute.startswith('qweb-js-'):
                _, _, attr = attribute.partition('qweb-js-')
                atts[attr] = atts.pop(attribute)
        return atts
