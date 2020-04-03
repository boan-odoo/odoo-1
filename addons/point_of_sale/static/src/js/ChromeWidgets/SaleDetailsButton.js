odoo.define('point_of_sale.SaleDetailsButton', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    class SaleDetailsButton extends PosComponent {
        static template = 'SaleDetailsButton';
        async onClick() {
            const saleDetails = await this.rpc({
                model: 'report.point_of_sale.report_saledetails',
                method: 'get_sale_details',
                args: [false, false, false, [this.env.pos.pos_session.id]],
            });
            const report = this.env.qweb.renderToString('SaleDetailsReport', {
                ...saleDetails,
                date: new Date().toLocaleString(),
                pos: this.env.pos,
            });
            const printResult = await this.env.pos.proxy.printer.print_receipt(report);
            if (!printResult.successful) {
                await this.showPopup('ErrorPopup', {
                    title: printResult.message.title,
                    body: printResult.message.body,
                });
            }
        }
    }

    Registries.Component.add(SaleDetailsButton);

    return SaleDetailsButton;
});
