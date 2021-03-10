odoo.define('point_of_sale.OfflineErrorPopup', function (require) {
    'use strict';

    const ErrorPopup = require('point_of_sale.ErrorPopup');

    /**
     * This is a special kind of error popup as it introduces
     * an option to not show it again.
     */
    class OfflineErrorPopup extends ErrorPopup {
        dontShowAgain() {
            this.env.model.data.uiState.showOfflineError = false;
            this.props.respondWith();
        }
    }
    OfflineErrorPopup.template = 'OfflineErrorPopup';
    OfflineErrorPopup.defaultProps = {
        confirmText: 'Ok',
        cancelText: 'Cancel',
        title: 'Offline Error',
        body: 'Either the server is inaccessible or browser is not connected online.',
    };

    return OfflineErrorPopup;
});
