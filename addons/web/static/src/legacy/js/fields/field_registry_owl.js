odoo.define('web.field_registry_owl', function (require) {
    "use strict";

    const Registry = require('web.Registry');

    return new Registry(
        null,
        (value) => value.prototype instanceof owl.Component
    );
});

odoo.define('web._field_registry_owl', function (require) {
    "use strict";

    /**
     * This module registers field components (specifications of the AbstractField Component)
     */

    const basicFields = require('web.basic_fields_owl');
    const registry = require('web.field_registry_owl');

    // Basic fields
    registry
        .add('badge', basicFields.FieldBadge);
        // https://runbot.odoo.com/runbot/batch/717372/build/13102423
        // also https://runbot.odoo.com/web#id=2158&action=573&model=runbot.build.error&view_type=form&cids=1&menu_id=405  ?
        // and https://runbot.odoo.com/web#id=3232&action=573&model=runbot.build.error&view_type=form&cids=1&menu_id=405
        // .add('boolean', basicFields.FieldBoolean);
});
