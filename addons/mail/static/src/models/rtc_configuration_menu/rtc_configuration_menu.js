/** @odoo-module **/

import { registerModel } from '@mail/model/model_core';
import { attr, one } from '@mail/model/model_field';

registerModel({
    name: 'RtcConfigurationMenu',
    identifyingFields: ['userSetting'],
    lifecycleHooks: {
        _created() {
            this.messaging.browser.addEventListener('keydown', this._onKeyDown);
            this.messaging.browser.addEventListener('keyup', this._onKeyUp);
        },
        _willDelete() {
            this.messaging.browser.removeEventListener('keydown', this._onKeyDown);
            this.messaging.browser.removeEventListener('keyup', this._onKeyUp);
        },
    },
    recordMethods: {
        /**
         * @param {String} value
         */
        onChangeDelay(value) {
            this.userSetting.setDelayValue(value);
        },
        onChangePushToTalk() {
            if (this.userSetting.usePushToTalk) {
                this.update({
                    isRegisteringKey: false,
                });
            }
            this.userSetting.togglePushToTalk();
        },
        /**
         * @param {String} value
         */
        onChangeSelectAudioInput(value) {
            this.userSetting.setAudioInputDevice(value);
        },
        /**
         * @param {String} value
         */
        onChangeThreshold(value) {
            this.userSetting.setThresholdValue(parseFloat(value));
        },
        onClickRegisterKeyButton() {
            this.update({
                isRegisteringKey: !this.isRegisteringKey,
            });
        },
        toggle() {
            this.update({ isOpen: !this.isOpen });
        },
        _onKeyDown(ev) {
            if (!this.isRegisteringKey) {
                return;
            }
            ev.stopPropagation();
            ev.preventDefault();
            this.userSetting.setPushToTalkKey(ev);
        },
        _onKeyUp(ev) {
            if (!this.isRegisteringKey) {
                return;
            }
            ev.stopPropagation();
            ev.preventDefault();
            this.update({
                isRegisteringKey: false,
            });
        },
    },
    fields: {
        isOpen: attr({
            default: false,
        }),
        /**
         * true if listening to keyboard input to register the push to talk key.
         */
        isRegisteringKey: attr({
            default: false,
        }),
        userSetting: one('UserSetting', {
            inverse: 'rtcConfigurationMenu',
            readonly: true,
        }),
    },
});
