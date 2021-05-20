/** @odoo-module **/

import { compute } from '@mail/model/fields/properties/compute/compute';
import { defaultProperty } from '@mail/model/fields/properties/default/default';
import { dependencies } from '@mail/model/fields/properties/dependencies/dependencies';
import { fieldName } from '@mail/model/fields/properties/field_name/field_name';
import { inverse } from '@mail/model/fields/properties/inverse/inverse';
import { isCausal } from '@mail/model/fields/properties/is_causal/is_causal';
import { isMany2X } from '@mail/model/fields/properties/is_many2x/is_many2x';
import { isOnChange } from '@mail/model/fields/properties/is_on_change/is_on_change';
import { isOne2X } from '@mail/model/fields/properties/is_one2x/is_one2x';
import { isRelation } from '@mail/model/fields/properties/is_relation/is_relation';
import { isX2Many } from '@mail/model/fields/properties/is_x2many/is_x2many';
import { isX2One } from '@mail/model/fields/properties/is_x2one/is_x2one';
import { readonly } from '@mail/model/fields/properties/readonly/readonly';
import { related } from '@mail/model/fields/properties/related/related';
import { required } from '@mail/model/fields/properties/required/required';
import { to } from '@mail/model/fields/properties/to/to';
import { attribute } from '@mail/model/fields/types/attribute/attribute';
import { relation } from '@mail/model/fields/types/relation/relation';

export function generateTypicalRegistries() {
    return {
        fieldPropertyRegistry: new Map([
            ['compute', compute],
            ['default', defaultProperty],
            ['dependencies', dependencies],
            ['fieldName', fieldName],
            ['inverse', inverse],
            ['isCausal', isCausal],
            ['isMany2X', isMany2X],
            ['isOnChange', isOnChange],
            ['isOne2X', isOne2X],
            ['isRelation', isRelation],
            ['isX2Many', isX2Many],
            ['isX2One', isX2One],
            ['readonly', readonly],
            ['related', related],
            ['required', required],
            ['to', to],
        ]),
        fieldTypeRegistry: new Map([
            ['attribute', attribute],
            ['relation', relation],
        ]),
    };
}
