/** @odoo-module **/

import { registerMessagingComponent } from '@mail/utils/messaging_component';

const { Component, onWillStart, useState } = owl;

export class RtcConfigurationMenu extends Component {

    /**
     * @override
     */
    setup() {
        super.setup();
        this.state = useState({
            userDevices: undefined,
        });
        onWillStart(() => this._willStart());
    }

    async _willStart() {
        this.state.userDevices = await this.messaging.browser.navigator.mediaDevices.enumerateDevices();
    }

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     * @param {Event} ev
     */
    _onChangeDelay(ev) {
        this.messaging.userSetting.rtcConfigurationMenu.onChangeDelay(ev.target.value);
    }

    /**
     * @private
     * @param {Event} ev
     */
    _onChangePushToTalk(ev) {
        this.messaging.userSetting.rtcConfigurationMenu.onChangePushToTalk();
    }

    /**
     * @private
     * @param {Event} ev
     */
    _onChangeSelectAudioInput(ev) {
        this.messaging.userSetting.rtcConfigurationMenu.onChangeSelectAudioInput(ev.target.value);
    }

    /**
     * @private
     * @param {Event} ev
     */
    _onChangeThreshold(ev) {
        this.messaging.userSetting.rtcConfigurationMenu.onChangeThreshold(ev.target.value);
    }

    /**
     * @private
     * @param {MouseEvent} ev
     */
    _onClickRegisterKeyButton() {
        this.messaging.userSetting.rtcConfigurationMenu.onClickRegisterKeyButton();
    }
}

Object.assign(RtcConfigurationMenu, {
    template: 'mail.RtcConfigurationMenu',
});

registerMessagingComponent(RtcConfigurationMenu);
