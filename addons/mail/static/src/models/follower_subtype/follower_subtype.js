/** @odoo-module **/

import { registerNewModel } from '@discuss/model/model_core';
import { attr } from '@discuss/model/model_field';

function factory(dependencies) {

    class FollowerSubtype extends dependencies['discuss.model'] {

        //----------------------------------------------------------------------
        // Public
        //----------------------------------------------------------------------

        /**
         * @static
         * @param {Object} data
         * @returns {Object}
         */
        static convertData(data) {
            const data2 = {};
            if ('default' in data) {
                data2.isDefault = data.default;
            }
            if ('id' in data) {
                data2.id = data.id;
            }
            if ('internal' in data) {
                data2.isInternal = data.internal;
            }
            if ('name' in data) {
                data2.name = data.name;
            }
            if ('parent_model' in data) {
                data2.parentModel = data.parent_model;
            }
            if ('res_model' in data) {
                data2.resModel = data.res_model;
            }
            if ('sequence' in data) {
                data2.sequence = data.sequence;
            }
            return data2;
        }

        //----------------------------------------------------------------------
        // Private
        //----------------------------------------------------------------------

        /**
         * @override
         */
        static _createRecordLocalId(data) {
            return `${this.modelName}_${data.id}`;
        }

    }

    FollowerSubtype.fields = {
        id: attr({
            required: true,
        }),
        isDefault: attr({
            default: false,
        }),
        isInternal: attr({
            default: false,
        }),
        name: attr(),
        // AKU FIXME: use relation instead
        parentModel: attr(),
        // AKU FIXME: use relation instead
        resModel: attr(),
        sequence: attr(),
    };

    FollowerSubtype.modelName = 'mail.follower_subtype';

    return FollowerSubtype;
}

registerNewModel('mail.follower_subtype', factory);
