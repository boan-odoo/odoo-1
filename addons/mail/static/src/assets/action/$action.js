/** @odoo-module **/

import { dispatch } from '@mail/core/model/dispatch';
import { ready } from '@mail/core/model/ready';

(async () => {
await ready;

dispatch(null, 'Record/insert', {
    'Record/type': 'Model', // just for easy 1st impl.
    'Record/traits': 'Model',
    'Model/name': 'Action',
});
dispatch(null, 'Record/insert', {
    'Record/type': 'Identification', // just for easy 1st impl.
    'Record/traits': 'Identification',
    'Action/name': true,
});
dispatch(null, 'Record/insert', {
    'Record/type': 'Field', // just for easy 1st impl.
    'Record/traits': 'Field',
    'Field/name': 'calledDefinitionChunks',
    'Field/model': 'Action',
    'Field/type': 'many',
    'Field/target': 'DefinitionChunk',
    'Field/inverse': 'DefinitionChunk/calledAction',
});
dispatch(null, 'Record/insert', {
    'Record/type': 'Field', // just for easy 1st impl.
    'Record/traits': 'Field',
    'Field/name': 'name',
    'Field/model': 'Action',
    'Field/type': 'attr',
    'Field/isReadonly': true,
    'Field/isRequired': true,
});

})();
