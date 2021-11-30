odoo.define('pos_coupon.tour.pos_coupon1', function (require) {
    'use strict';

    // --- PoS Coupon Tour Basic Part 1 ---
    // Generate coupons for PosCouponTour2.

    const { PosCoupon } = require('pos_coupon.tour.PosCouponTourMethods');
    const { ProductScreen } = require('point_of_sale.tour.ProductScreenTourMethods');
    const { getSteps, startSteps } = require('point_of_sale.tour.utils');
    var Tour = require('web_tour.tour');

    startSteps();

    ProductScreen.do.confirmOpeningPopup();
    ProductScreen.do.clickHomeCategory();

    // basic order
    // just accept the automatically applied promo program
    // applied programs:
    //   - on cheapest product
    ProductScreen.exec.addOrderline('Whiteboard Pen', '5');
    PosCoupon.do.claimSingleReward();
    PosCoupon.check.hasRewardLine('90% on the cheapest product', '-2.88');
    PosCoupon.do.selectRewardLine('on the cheapest product');
    PosCoupon.check.orderTotalIs('13.12');
    PosCoupon.exec.finalizeOrder('Cash', '20');

    // remove the reward from auto promo program
    // no applied programs
    ProductScreen.exec.addOrderline('Whiteboard Pen', '6');
    PosCoupon.do.claimSingleReward();
    PosCoupon.check.hasRewardLine('on the cheapest product', '-2.88');
    PosCoupon.check.orderTotalIs('16.32');
    PosCoupon.exec.removeRewardLine('90% on the cheapest product');
    PosCoupon.check.orderTotalIs('19.2');
    PosCoupon.exec.finalizeOrder('Cash', '20');

    // order with coupon code from coupon program
    // applied programs:
    //   - coupon program
    ProductScreen.exec.addOrderline('Desk Organizer', '9');
    PosCoupon.do.claimSingleReward();
    PosCoupon.check.hasRewardLine('on the cheapest product', '-4.59');
    PosCoupon.exec.removeRewardLine('90% on the cheapest product');
    PosCoupon.check.orderTotalIs('45.90');
    PosCoupon.do.enterCode('invalid_code', false);
    PosCoupon.do.enterCode('1234');
    PosCoupon.check.hasRewardLine('Free Product - Desk Organizer', '-15.30');
    PosCoupon.exec.finalizeOrder('Cash', '50');

    // Use coupon but eventually remove the reward
    // applied programs:
    //   - on cheapest product
    ProductScreen.exec.addOrderline('Letter Tray', '4');
    ProductScreen.exec.addOrderline('Desk Organizer', '9');
    PosCoupon.do.claimSingleReward();
    PosCoupon.check.hasRewardLine('90% on the cheapest product', '-4.75');
    PosCoupon.check.orderTotalIs('62.27');
    PosCoupon.do.enterCode('5678');
    PosCoupon.check.hasRewardLine('Free Product - Desk Organizer', '-15.30');
    PosCoupon.check.orderTotalIs('46.97');
    PosCoupon.exec.removeRewardLine('Free Product');
    PosCoupon.check.orderTotalIs('62.27');
    PosCoupon.exec.finalizeOrder('Cash', '90');

    // specific product discount
    // applied programs:
    //   - on cheapest product
    //   - on specific products
    ProductScreen.exec.addOrderline('Magnetic Board', '10') // 1.98
    ProductScreen.exec.addOrderline('Desk Organizer', '3') // 5.1
    ProductScreen.exec.addOrderline('Letter Tray', '4') // 4.8 tax 10%
    PosCoupon.do.claimSingleReward();
    PosCoupon.check.hasRewardLine('90% on the cheapest product', '-1.78')
    PosCoupon.check.orderTotalIs('54.44')
    PosCoupon.do.enterCode('promocode', false)
    PosCoupon.check.hasRewardLine('50% on specific products', '-16.66') // 17.55 - 1.78*0.5
    PosCoupon.check.orderTotalIs('37.78')
    PosCoupon.exec.finalizeOrder('Cash', '50')

    Tour.register('PosCouponTour1', { test: true, url: '/pos/web' }, getSteps());
});
