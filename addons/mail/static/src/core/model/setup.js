
/** @odoo-module **/

import { _insert } from '@mail/core/model/_insert';
import { _setupField } from '@mail/core/model/_setup-field';
import { _setupModel } from '@mail/core/model/_setup-model';
import { _setupPrimitive } from '@mail/core/model/_setup-primitive';
import { ready } from '@mail/core/model/ready';

export function setup() {
    _setupField();
    _setupModel();
    _setupPrimitive();

    // Record/insert
    _insert(null, {
        'Record/type': 'Action',
        'Action/name': 'Record/insert',
        'Action/behavior': (ctx, data) => _insert(ctx, data),
    });
    ready.resolve();
}
