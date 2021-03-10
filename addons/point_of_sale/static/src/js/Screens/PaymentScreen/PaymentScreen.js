odoo.define('point_of_sale.PaymentScreen', function (require) {
    'use strict';

    const { parse } = require('web.field_utils');
    const { float_is_zero } = require('web.utils');
    const PosComponent = require('point_of_sale.PosComponent');
    const NumberBuffer = require('point_of_sale.NumberBuffer');
    const { useListener } = require('web.custom_hooks');
    const PSNumpadInputButton = require('point_of_sale.PSNumpadInputButton');
    const PaymentScreenStatus = require('point_of_sale.PaymentScreenStatus');
    const PaymentScreenElectronicPayment = require('point_of_sale.PaymentScreenElectronicPayment');

    class PaymentScreen extends PosComponent {
        static components = { PSNumpadInputButton, PaymentScreenStatus, PaymentScreenElectronicPayment };
        constructor() {
            super(...arguments);
            useListener('add-payment', this._onAddPayment);
            useListener('select-payment', this._onSelectPayment);
            useListener('delete-payment', this._onDeletePayment);
            useListener('update-selected-payment', this._onUpdateSelectedPayment);
            useListener('send-payment-request', this._onSendPaymentRequest);
            useListener('send-payment-cancel', this._onSendPaymentCancel);
            useListener('send-payment-reverse', this._onSendPaymentReverse);
            useListener('send-force-done', this._onSendForceDone);
            NumberBuffer.use({
                nonKeyboardInputEvent: 'input-from-numpad',
                triggerAtInput: 'update-selected-payment',
            });
            this._validating = false;
        }
        _onAddPayment(event) {
            const paymentMethod = event.detail;
            this.env.actionHandler({
                name: 'actionAddPayment',
                args: [this.props.activeOrder, paymentMethod],
            });
            NumberBuffer.reset();
        }
        _onSelectPayment(event) {
            const payment = event.detail;
            this.env.actionHandler({ name: 'actionSelectPayment', args: [payment] });
            NumberBuffer.reset();
        }
        _onDeletePayment(event) {
            const payment = event.detail;
            this.env.actionHandler({ name: 'actionDeletePayment', args: [payment] });
            NumberBuffer.reset();
        }
        _onUpdateSelectedPayment(event) {
            const { buffer, key } = event.detail;
            const activePayment = this.env.model.getActivePayment(this.props.activeOrder);
            if (
                !activePayment ||
                (this._isElectronicPayment(activePayment) && this._isElectronicPaymentDone(activePayment))
            ) {
                NumberBuffer.set(key);
                const amount = parse.float(NumberBuffer.get());
                const paymentMethod = this.env.model.data.derived.paymentMethods[0];
                this.env.actionHandler({
                    name: 'actionAddPayment',
                    args: [this.props.activeOrder, paymentMethod, amount],
                });
                return;
            }
            const paymentTerminal = this.env.model.getPaymentTerminal(activePayment.payment_method_id);
            // disable changing amount on paymentlines with running or done payments on a payment terminal
            if (paymentTerminal && !['pending'].includes(activePayment.payment_status)) {
                return;
            }
            if (buffer === null) {
                this.env.actionHandler({ name: 'actionDeletePayment', args: [activePayment] });
            } else {
                this.env.actionHandler({
                    name: 'actionUpdatePayment',
                    args: [activePayment, { amount: parse.float(buffer) }],
                });
            }
        }
        async _onSendPaymentRequest({ detail: payment }) {
            this.env.actionHandler({ name: 'actionSendPaymentRequest', args: [this.props.activeOrder, payment] });
        }
        async _onSendPaymentCancel({ detail: payment }) {
            this.env.actionHandler({ name: 'actionSendPaymentCancel', args: [this.props.activeOrder, payment] });
        }
        async _onSendPaymentReverse({ detail: payment }) {
            this.env.actionHandler({ name: 'actionSendPaymentReverse', args: [this.props.activeOrder, payment] });
        }
        async _onSendForceDone({ detail: payment }) {
            this.env.actionHandler({ name: 'actionSendForceDone', args: [this.props.activeOrder, payment] });
        }
        get previousScreen() {
            return 'ProductScreen';
        }
        get nextScreen() {
            return 'ReceiptScreen';
        }
        async onSelectClient() {
            // IMPROVEMENT: This code snippet is repeated multiple times.
            // Maybe it's better to create a function for it.
            const [confirmed, selectedClientId] = await this.showTempScreen('ClientListScreen', {
                clientId: this.props.activeOrder.partner_id,
            });
            if (confirmed) {
                this.env.actionHandler({
                    name: 'actionSetClient',
                    args: [this.props.activeOrder, selectedClientId || false],
                });
            }
        }
        onOpenCashbox() {
            if (this.env.model.proxy.printer) {
                this.env.model.proxy.printer.open_cashbox();
            }
        }
        async onValidateOrder(order) {
            if (this._validating || !(await this._isOrderValid(order))) return;
            try {
                this._validating = true;
                await this.env.actionHandler({ name: 'actionValidateOrder', args: [order, this.nextScreen] });
            } finally {
                this._validating = false;
            }
        }
        async _isOrderValid(order) {
            const orderlines = this.env.model.getOrderlines(order);
            if (orderlines.length === 0) {
                this.env.ui.askUser('ErrorPopup', {
                    title: this.env._t('Empty Order'),
                    body: this.env._t('There must be at least one product in your order before it can be validated'),
                });
                return false;
            }
            if (!this.getOrderIsPaid(order)) {
                return false;
            }
            if ((order.to_invoice || order.to_ship) && !order.partner_id) {
                const confirmed = await this.env.ui.askUser('ConfirmPopup', {
                    title: this.env._t('Please select the Customer'),
                    body: this.env._t('You need to select the customer before you can invoice or ship an order.'),
                });
                if (confirmed) {
                    this.onSelectClient();
                }
                return false;
            }

            const customer = this.env.model.getCustomer(order);
            if (order.to_ship && !(customer && customer.name && customer.street && customer.city && customer.country_id)) {
                this.env.ui.askUser('ErrorPopup', {
                    title: this.env._t('Incorrect address for shipping'),
                    body: this.env._t('The selected customer needs an address.'),
                });
                return false;
            }

            const invalidPayment = this.env.model.getInvalidRoundingPayment(order);
            if (invalidPayment) {
                const incorrectRoundingMessage = _.str.sprintf(
                    this.env._t('You have to round your payments lines. %s is not rounded.'),
                    this.env.model.formatCurrency(invalidPayment.amount)
                );
                this.env.ui.askUser('ErrorPopup', {
                    title: this.env._t('Incorrect rounding'),
                    body: incorrectRoundingMessage,
                });
                return false;
            }
            // The exact amount must be paid if there is no cash payment method defined.
            const isChangeZero = this.env.model.floatCompare(this.env.model.getOrderChange(order), 0) === 0;
            const hasCashPaymentMethod = _.some(this.env.model.data.derived.paymentMethods, (method) => method.is_cash_count);
            if (!isChangeZero && !hasCashPaymentMethod) {
                this.env.ui.askUser('ErrorPopup', {
                    title: this.env._t('Cannot return change without a cash payment method'),
                    body: this.env._t(
                        'There is no cash payment method available in this point of sale to handle the change.\n\n' +
                            ' Please pay the exact amount or add a cash payment method in the point of sale configuration'
                    ),
                });
                return false;
            }
            // if the change is too large, it's probably an input error, make the user confirm.
            const { withTaxWithDiscount } = this.env.model.getOrderTotals(order);
            const totalPayment = this.env.model.getPaymentsTotalAmount(order);
            if (withTaxWithDiscount * 1000 < totalPayment) {
                const confirmed = await this.env.ui.askUser('ConfirmPopup', {
                    title: this.env._t('Please Confirm Large Amount'),
                    body:
                        this.env._t('Are you sure that the customer wants to  pay') +
                        ' ' +
                        this.env.model.formatCurrency(totalPayment) +
                        ' ' +
                        this.env._t('for an order of') +
                        ' ' +
                        this.env.model.formatCurrency(withTaxWithDiscount) +
                        ' ' +
                        this.env._t('? Clicking "Confirm" will validate the payment.'),
                });
                return confirmed;
            }
            return true;
        }
        getPaymentMethod(payment) {
            return this.env.model.getRecord('pos.payment.method', payment.payment_method_id);
        }
        isPaymentSelected(payment) {
            const order = this.env.model.getRecord('pos.order', payment.pos_order_id);
            const activePayment = this.env.model.getActivePayment(order);
            return activePayment ? payment.id === activePayment.id : false;
        }
        getPaymentlineExtraClass(payment) {
            return this.isPaymentSelected(payment)
                ? this.selectedLineClass(payment)
                : this.unselectedLineClass(payment);
        }
        // IMPROVEMENT: should be better if named selectedPaymentClass, and the other unselectedPaymentClass
        selectedLineClass(payment) {
            return { selected: true, 'payment-terminal': payment.payment_status };
        }
        unselectedLineClass(payment) {
            return {};
        }
        _isElectronicPayment(payment) {
            return Boolean(payment.payment_status);
        }
        _isElectronicPaymentDone(electronicPayment) {
            return ['done', 'reversed'].includes(electronicPayment.payment_status);
        }
        _isElectronicPaymentInProgress() {
            const electronicPayments = this.env.model
                .getPayments(this.props.activeOrder)
                .filter((payment) => this._isElectronicPayment(payment));
            return _.some(electronicPayments, (payment) => !this._isElectronicPaymentDone(payment));
        }
        getOrderIsPaid(order) {
            const due = this.env.model.getOrderDue(order);
            return (
                (due < 0 || float_is_zero(due, this.env.model.currency.decimal_places)) &&
                !this._isElectronicPaymentInProgress()
            );
        }
    }
    PaymentScreen.template = 'PaymentScreen';

    return PaymentScreen;
});
