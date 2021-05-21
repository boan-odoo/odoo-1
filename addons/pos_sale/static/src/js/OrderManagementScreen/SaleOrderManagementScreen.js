odoo.define('pos_sale.SaleOrderManagementScreen', function (require) {
    'use strict';

    const { useContext } = owl.hooks;
    const { useListener } = require('web.custom_hooks');
    const ControlButtonsMixin = require('point_of_sale.ControlButtonsMixin');
    const NumberBuffer = require('point_of_sale.NumberBuffer');
    const Registries = require('point_of_sale.Registries');
    const SaleOrderFetcher = require('pos_sale.SaleOrderFetcher');
    const IndependentToOrderScreen = require('point_of_sale.IndependentToOrderScreen');
    const contexts = require('point_of_sale.PosContext');
    const models = require('point_of_sale.models');

    class SaleOrderManagementScreen extends ControlButtonsMixin(IndependentToOrderScreen) {
        constructor() {
            super(...arguments);
            useListener('close-screen', this.close);
            useListener('click-sale-order', this._onClickSaleOrder);
            useListener('next-page', this._onNextPage);
            useListener('prev-page', this._onPrevPage);
            useListener('search', this._onSearch);

            SaleOrderFetcher.setComponent(this);
            this.orderManagementContext = useContext(contexts.orderManagement);
        }
        mounted() {
            SaleOrderFetcher.on('update', this, this.render);
            this.env.pos.get('orders').on('add remove', this.render, this);

            // calculate how many can fit in the screen.
            // It is based on the height of the header element.
            // So the result is only accurate if each row is just single line.
            const flexContainer = this.el.querySelector('.flex-container');
            const cpEl = this.el.querySelector('.control-panel');
            const headerEl = this.el.querySelector('.order-row.header');
            const val = Math.trunc(
                (flexContainer.offsetHeight - cpEl.offsetHeight - headerEl.offsetHeight) /
                    headerEl.offsetHeight
            );
            SaleOrderFetcher.setNPerPage(val);

            // Fetch the order after mounting so that order management screen
            // is shown while fetching.
            setTimeout(() => SaleOrderFetcher.fetch(), 0);
        }
        willUnmount() {
            SaleOrderFetcher.off('update', this);
            this.env.pos.get('orders').off('add remove', null, this);
        }
        get selectedClient() {
            const order = this.orderManagementContext.selectedOrder;
            return order ? order.get_client() : null;
        }
        get orders() {
            return SaleOrderFetcher.get();
        }
        async _setNumpadMode(event) {
            const { mode } = event.detail;
            this.numpadMode = mode;
            NumberBuffer.reset();
        }
        _onNextPage() {
            SaleOrderFetcher.nextPage();
        }
        _onPrevPage() {
            SaleOrderFetcher.prevPage();
        }
        _onSearch({ detail: domain }) {
            SaleOrderFetcher.setSearchDomain(domain);
            SaleOrderFetcher.setPage(1);
            SaleOrderFetcher.fetch();
        }
        async _onClickSaleOrder({ detail: clickedOrder }) {
            const { confirmed, payload: selectedOption } = await this.showPopup('SelectionPopup',
                {
                    title: this.env._t('What do you want to do?'),
                    list: [{id:"0", label: "Apply a down payment", item: false}, {id:"1", label: "Settle the order", item: true}],
                });

            if(confirmed){
              let currentPOSOrder = this.env.pos.get_order();
              let sale_order = await this._getSaleOrder(clickedOrder.id);
              currentPOSOrder.set_client(this.env.pos.db.get_partner_by_id(sale_order.partner_id[0]));
              let orderFiscalPos = sale_order.fiscal_position_id ? this.env.pos.fiscal_positions.find(
                  (position) => position.id === sale_order.fiscal_position_id[0]
              )
              : false;
              if (orderFiscalPos){
                  currentPOSOrder.fiscal_position = orderFiscalPos;
              }
              let orderPricelist = sale_order.pricelist_id ? this.env.pos.pricelists.find(
                  (pricelist) => pricelist.id === sale_order.pricelist_id[0]
              )
              : false;
              if (orderPricelist){
                  currentPOSOrder.set_pricelist(orderPricelist);
              }

              if (selectedOption){
                // settle the order
                let lines = sale_order.order_line;
                let product_to_add_in_pos = lines.filter(line => !this.env.pos.db.get_product_by_id(line.product_id[0])).map(line => line.product_id[0]);
                if (product_to_add_in_pos.length){
                    const { confirmed } = await this.showPopup('ConfirmPopup', {
                        title: this.env._t('Products not available in POS'),
                        body:
                            this.env._t(
                                'Some of the products in your Sale Order are not available in POS, do you want to import them?'
                            ),
                        confirmText: this.env._t('Yes'),
                        cancelText: this.env._t('No'),
                    });
                    if (confirmed){
                        await this.env.pos._addProducts(product_to_add_in_pos);
                    }

                }


                for (var i = 0; i < lines.length; i++) {
                    let line = lines[i];
                    if (!this.env.pos.db.get_product_by_id(line.product_id[0])){
                        continue;
                    }

                    let new_line = new models.Orderline({}, {
                        pos: this.env.pos,
                        order: this.env.pos.get_order(),
                        product: this.env.pos.db.get_product_by_id(line.product_id[0]),
                        price: line.price_unit,
                        price_manually_set: true,
                        sale_order_origin_id: clickedOrder,
                        sale_order_line_id: line,
                    });

                    if (
                        new_line.get_product().tracking !== 'none' &&
                        (this.env.pos.picking_type.use_create_lots || this.env.pos.picking_type.use_existing_lots)
                    ) {
                        new_line.setPackLotLines({
                            modifiedPackLotLines: [],
                            newPackLotLines: (line.lot_names || []).map((name) => ({ lot_name: name })),
                        });
                    }
                    new_line.setQuantityFromSOL(line);
                    new_line.set_unit_price(line.price_unit);
                    new_line.set_discount(line.discount);
                    this.env.pos.get_order().add_orderline(new_line);
                }
              }
              else {
                // apply a downpayment
                let lines = sale_order.order_line;
                let tab = [];

                for (let i=0; i<lines.length; i++) {
                    tab[i] = {
                        'product_name': lines[i].product_id[1],
                        'product_uom_qty': lines[i].product_uom_qty,
                        'price_unit': lines[i].price_unit,
                        'total': lines[i].price_total,
                    }
                }

                clickedOrder.productDetails = tab;

                let new_line = new models.Orderline({}, {
                    pos: this.env.pos,
                    order: this.env.pos.get_order(),
                    product: this.env.pos.db.get_product_by_id(this.env.pos.config.down_payment_product_id[0]),
                    price: sale_order.amount_total,
                    price_manually_set: true,
                    sale_order_origin_id: clickedOrder,
                });
                new_line.set_unit_price(sale_order.amount_total);
                this.env.pos.get_order().add_orderline(new_line);
              }

              currentPOSOrder.trigger('change');
              this.close();
            }

        }

        async _getSaleOrder(id) {
            let sale_order = await this.rpc({
                model: 'sale.order',
                method: 'read',
                args: [[id],['order_line', 'partner_id', 'pricelist_id', 'fiscal_position_id', 'amount_total', 'amount_untaxed']],
                context: this.env.session.user_context,
              });

            let sale_lines = await this._getSOLines(sale_order[0].order_line);
            sale_order[0].order_line = sale_lines;

            return sale_order[0];
        }

        async _getSOLines(ids) {
          let so_lines = await this.rpc({
              model: 'sale.order.line',
              method: 'read_converted',
              args: [ids],
              context: this.env.session.user_context,
          });
          let pos_lines = so_lines.filter(line => line.product_type);
          return pos_lines;
        }

    }
    SaleOrderManagementScreen.template = 'SaleOrderManagementScreen';
    SaleOrderManagementScreen.hideOrderSelector = true;

    Registries.Component.add(SaleOrderManagementScreen);

    return SaleOrderManagementScreen;
});
