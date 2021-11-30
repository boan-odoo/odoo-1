odoo.define('pos_coupon.tour.pos_coupon2', function (require) {
    'use strict';

    // --- PoS Coupon Tour Basic Part 2 ---
    // Using the coupons generated from PosCouponTour1.

    const { PosCoupon } = require('pos_coupon.tour.PosCouponTourMethods');
    const { ProductScreen } = require('point_of_sale.tour.ProductScreenTourMethods');
    const { getSteps, startSteps } = require('point_of_sale.tour.utils');
    var Tour = require('web_tour.tour');

    startSteps();

    ProductScreen.do.clickHomeCategory();

    // Test that global discount and cheapest product discounts can be accumulated.
    // Applied programs:
    //   - global discount
    //   - on cheapest discount
    ProductScreen.exec.addOrderline('Desk Organizer', '10'); // 5.1
    PosCoupon.do.claimSingleReward();
    PosCoupon.check.hasRewardLine('on the cheapest product', '-4.59');
    ProductScreen.exec.addOrderline('Letter Tray', '4'); // 4.8 tax 10%
    PosCoupon.check.hasRewardLine('on the cheapest product', '-4.75');
    PosCoupon.do.enterCode('123456');
    PosCoupon.check.hasRewardLine('10% on your order', '-5.10');
    PosCoupon.check.hasRewardLine('10% on your order', '-1.64');
    PosCoupon.check.orderTotalIs('60.63'); //SUBTOTAL
    PosCoupon.exec.finalizeOrder('Cash', '70');

    // Scanning coupon twice.
    // Also apply global discount on top of free product to check if the
    // calculated discount is correct.
    // Applied programs:
    //  - coupon program (free product)
    //  - global discount
    //  - on cheapest discount
    ProductScreen.exec.addOrderline('Desk Organizer', '11'); // 5.1 per item
    PosCoupon.do.claimSingleReward();
    PosCoupon.check.hasRewardLine('90% on the cheapest product', '-4.59');
    PosCoupon.check.orderTotalIs('51.51');
    // add global discount and the discount will be replaced
    PosCoupon.do.enterCode('345678');
    PosCoupon.check.hasRewardLine('10% on your order', '-5.15');
    // add free product coupon (for qty=11, free=4)
    // the discount should change after having free products
    // it should go back to cheapest discount as it is higher
    PosCoupon.do.enterCode('5678');
    PosCoupon.check.hasRewardLine('Free Product - Desk Organizer', '-20.40');
    PosCoupon.check.hasRewardLine('90% on the cheapest product', '-4.59');
    // set quantity to 18
    // free qty stays the same since the amount of points on the card only allows for 4 free products
    ProductScreen.do.pressNumpad('Backspace 8')
    PosCoupon.check.hasRewardLine('10% on your order', '-6.68');
    PosCoupon.check.hasRewardLine('Free Product - Desk Organizer', '-20.40');
    // scan the code again and check notification
    PosCoupon.do.enterCode('5678');
    PosCoupon.check.orderTotalIs('60.13');
    PosCoupon.exec.finalizeOrder('Cash', '65');

    // Specific products discount (with promocode) and free product (1357)
    // Applied programs:
    //   - discount on specific products
    //   - free product
    ProductScreen.exec.addOrderline('Desk Organizer', '6'); // 5.1 per item
    PosCoupon.do.claimSingleReward();
    PosCoupon.check.hasRewardLine('on the cheapest product', '-4.59');
    PosCoupon.exec.removeRewardLine('90% on the cheapest product');
    PosCoupon.do.enterCode('promocode', false);
    PosCoupon.check.hasRewardLine('50% on specific products', '-15.30');
    PosCoupon.do.enterCode('1357');
    PosCoupon.check.hasRewardLine('Free Product - Desk Organizer', '-10.20');
    PosCoupon.check.hasRewardLine('50% on specific products', '-10.20');
    PosCoupon.check.orderTotalIs('10.20');
    PosCoupon.exec.finalizeOrder('Cash', '20');

    // Check reset program
    // Enter two codes and reset the programs.
    // The codes should be checked afterwards. They should return to new.
    // Applied programs:
    //   - cheapest product
    ProductScreen.exec.addOrderline('Monitor Stand', '6'); // 3.19 per item
    PosCoupon.do.claimSingleReward();
    PosCoupon.do.enterCode('098765');
    PosCoupon.check.hasRewardLine('90% on the cheapest product', '-2.87');
    PosCoupon.check.hasRewardLine('10% on your order', '-1.63');
    PosCoupon.check.orderTotalIs('14.64');
    PosCoupon.exec.removeRewardLine('90% on the cheapest product');
    PosCoupon.check.hasRewardLine('10% on your order', '-1.91');
    PosCoupon.check.orderTotalIs('17.23');
    PosCoupon.do.resetActivePrograms();
    PosCoupon.do.claimSingleReward();
    PosCoupon.check.hasRewardLine('90% on the cheapest product', '-2.87');
    PosCoupon.check.orderTotalIs('16.27');
    PosCoupon.exec.finalizeOrder('Cash', '20');

    Tour.register('PosCouponTour2', { test: true, url: '/pos/web' }, getSteps());
});
