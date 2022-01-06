/** @odoo-module **/

import { registerModel } from '@mail/model/model_core';
import { attr } from '@mail/model/model_field';
import { isMobileOS } from "@web/core/browser/feature_detection";
import { SIZES } from '@web/core/ui/ui_service';

registerModel({
    name: 'Device',
    identifyingFields: ['messaging'],
    lifecycleHooks: {
        _created() {
            this._refresh();
            this._onResize = _.debounce(() => this._refresh(), 100);
        },
        _willDelete() {
            window.removeEventListener('resize', this._onResize);
        },
    },
    recordMethods: {
        /**
         * Called when messaging is started.
         */
        start() {
            // TODO FIXME Not using this.env.browser because it's proxified, and
            // addEventListener does not work on proxified window. task-2234596
            window.addEventListener('resize', this._onResize);
        },
        /**
         * @private
         */
        _refresh() {
            this.update({
                globalWindowInnerHeight: window.innerHeight,
                globalWindowInnerWidth: window.innerWidth,
                isSmall: this.env.isSmall,
                isMobileDevice: isMobileOS(),
                sizeClass: this.env.services.ui.size,
            });
        },
    },
    fields: {
        globalWindowInnerHeight: attr(),
        globalWindowInnerWidth: attr(),
        /**
         * States whether this device has a small size (note: this field name is not ideal).
         */
        isSmall: attr(),
        /**
         * States whether this device is an actual mobile device.
         */
        isMobileDevice: attr(),
        /**
         * Size class of the device.
         *
         * This is an integer representation of the size.
         * Useful for conditional based on a device size, including
         * lower/higher. Device size classes are defined in sizeClasses
         * attribute.
         */
        sizeClass: attr(),
        sizeClasses: attr({
            default: SIZES,
        }),
    },
});
