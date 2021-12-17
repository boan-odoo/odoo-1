odoo.define('point_of_sale.tour.ClientListScreenTourMethods', function (require) {
    'use strict';

    const { createTourMethods } = require('point_of_sale.tour.utils');

    class Do {
        clickClient(name) {
            return [
                {
                    content: `click client '${name}' from client list screen`,
                    trigger: `.clientlist-screen .client-list-contents .client-line td:contains("${name}")`,
                },
            ];
        }
    }

    class Check {
        isShown() {
            return [
                {
                    content: 'client list screen is shown',
                    trigger: '.pos-content .clientlist-screen',
                    run: () => {},
                },
            ];
        }
    }

    class Execute {}

    return createTourMethods('ClientListScreen', Do, Check, Execute);
});
