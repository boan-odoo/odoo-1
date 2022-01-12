odoo.define('point_of_sale.ClientListScreen', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const { isConnectionError } = require('point_of_sale.utils');

    const { debounce } = require("@web/core/utils/timing");
    const { useListener } = require("@web/core/utils/hooks");

    const { onWillUnmount } = owl;

    /**
     * Render this screen using `showTempScreen` to select client.
     * When the shown screen is confirmed ('Set Customer' or 'Deselect Customer'
     * button is clicked), the call to `showTempScreen` resolves to the
     * selected client. E.g.
     *
     * ```js
     * const { confirmed, payload: selectedClient } = await showTempScreen('ClientListScreen');
     * if (confirmed) {
     *   // do something with the selectedClient
     * }
     * ```
     *
     * @props client - originally selected client
     */
    class ClientListScreen extends PosComponent {
        setup() {
            super.setup();
            useListener('click-save', () => this.env.bus.trigger('save-customer'));
            useListener('save-changes', this.saveChanges);

            // We are not using useState here because the object
            // passed to useState converts the object and its contents
            // to Observer proxy. Not sure of the side-effects of making
            // a persistent object, such as pos, into Observer. But it
            // is better to be safe.
            this.state = {
                query: null,
                selectedClient: this.props.client,
                detailIsShown: false,
                editModeProps: {
                    partner: {
                        country_id: this.env.pos.company.country_id,
                        state_id: this.env.pos.company.state_id,
                    }
                },
            };
            this.updateClientList = debounce(this.updateClientList, 70);
            onWillUnmount(this.updateClientList.cancel);
        }
        // Lifecycle hooks
        back() {
            if(this.state.detailIsShown) {
                this.state.detailIsShown = false;
                this.render();
            } else {
                this.props.resolve({ confirmed: false, payload: false });
                this.trigger('close-temp-screen');
            }
        }
        confirm() {
            this.props.resolve({ confirmed: true, payload: this.state.selectedClient });
            this.trigger('close-temp-screen');
        }
        // Getters

        get currentOrder() {
            return this.env.pos.get_order();
        }

        get clients() {
            let res;
            if (this.state.query && this.state.query.trim() !== '') {
                res = this.env.pos.db.search_partner(this.state.query.trim());
            } else {
                res = this.env.pos.db.get_partners_sorted(1000);
            }
            return res.sort(function (a, b) { return (a.name || '').localeCompare(b.name || '') });
        }
        get isEveryPartnerLoadedAfterStartOfSession() {
            return !this.env.pos.config.limited_partners_loading || this.env.pos.config.partner_load_background;
        }
        get isBalanceDisplayed() {
            return this.env.pos.config.module_pos_loyalty;
        }

        // Methods

        // We declare this event handler as a debounce function in
        // order to lower its trigger rate.
        async updateClientList(event) {
            this.state.query = event.target.value;
            const clients = this.clients;
            if (event.code === 'Enter') {
                if (!this.isEveryPartnerLoadedAfterStartOfSession) {
                    await this.searchClient();
                }
                if (clients.length === 1) {
                    this.clickClient(clients[0]);
                }
            } else {
                this.render();
            }
        }
        clickClient(partner) {
            if (this.state.selectedClient === partner) {
                this.state.selectedClient = null;
            } else {
                this.state.selectedClient = partner;
            }
            this.confirm();
        }
        activateEditMode(event) {
            const { isNewClient, partner } = event.detail;
            this.state.detailIsShown = true;
            if (!isNewClient) {
                this.state.editModeProps.partner = partner;
            }
            this.render();
        }
        async saveChanges(event) {
            try {
                let partnerId = await this.rpc({
                    model: 'res.partner',
                    method: 'create_from_ui',
                    args: [event.detail.processedChanges],
                });
                await this.env.pos.load_new_partners();
                this.state.selectedClient = this.env.pos.db.get_partner_by_id(partnerId);
                this.confirm();
            } catch (error) {
                if (isConnectionError(error)) {
                    await this.showPopup('OfflineErrorPopup', {
                        title: this.env._t('Offline'),
                        body: this.env._t('Unable to save changes.'),
                    });
                } else {
                    throw error;
                }
            }
        }
        async searchClient() {
            let result = await this.getNewClient();
            this.env.pos.db.add_partners(result);
            if(!result.length) {
                await this.showPopup('ErrorPopup', {
                    title: '',
                    body: this.env._t('No customer found'),
                });
            }
            this.render();
        }
        async getNewClient() {
            var domain = [];
            if(this.state.query) {
                domain = [["name", "ilike", this.state.query + "%"]];
            }
            const result = await this.env.services.rpc(
                {
                    model: 'pos.session',
                    method: 'get_pos_ui_res_partner_by_params',
                    args: [
                        [odoo.pos_session_id],
                        {
                            domain,
                            limit: 10,
                        },
                    ],
                    context: this.env.session.user_context,
                },
                {
                    timeout: 3000,
                    shadow: true,
                }
            );
            return result;
        }
    }
    ClientListScreen.template = 'ClientListScreen';

    Registries.Component.add(ClientListScreen);

    return ClientListScreen;
});
