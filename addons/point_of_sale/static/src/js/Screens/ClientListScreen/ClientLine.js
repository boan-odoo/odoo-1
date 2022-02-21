odoo.define('point_of_sale.ClientLine', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    class ClientLine extends PosComponent {
        get highlight() {
            return this.props.partner !== this.props.selectedClient ? '' : 'highlight';
        }
        get shortAddress() {
            const { partner } = this.props;
            return [partner.zip, partner.city, partner.state_id[1]].filter(field => field).join(', ');
        }
    }
    ClientLine.template = 'ClientLine';

    Registries.Component.add(ClientLine);

    return ClientLine;
});
