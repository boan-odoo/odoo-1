/** @odoo-module **/

import models from 'point_of_sale.models';
import session from 'web.session';
import concurrency from 'web.concurrency';
import { Gui } from 'point_of_sale.Gui';
import { float_is_zero, round_precision } from 'web.utils';
import { core } from 'web.core';
const _t = core._t;

const dp = new concurrency.DropPrevious();

// Load programs and products used by our programs
const existing_models = models.PosModel.prototype.models;
const product_model = _.find(existing_models, (model) => {return model.model === 'product.product'});

function _newRandomRewardCode() {
    return (Math.random() + 1).toString(36).substring(3);
}

//TODO: necessary?
models.load_fields('pos.order.line', ['reward_id', 'coupon_id', 'reward_identified_code', 'is_reward_line', 'points_code']);

models.load_models([
    {
        model: 'loyalty.program',
        fields: ['name', 'portal_point_name'],
        domain: function (self) {
            return [['id', 'in', self.config.all_program_ids]];
        },
        loaded: function (self, programs) {
            self.programs = programs;
            self.program_by_id = Object.fromEntries(programs.map((program) => [program.id, program]));
        },
    },
    {
        model: 'loyalty.rule',
        fields: ['program_id', 'valid_product_ids', 'any_product', 'currency_id',
            'reward_point_amount', 'reward_point_trigger_multi', 'reward_point_mode',
            'minimum_qty', 'minimum_amount', 'minimum_amount_tax_mode'],
        domain: function(self) {
            return [['program_id', 'in', self.config.all_program_ids]];
        },
        loaded: function (self, rules) {
            self.rules = rules;
            rules.forEach((rule) => {
                program = self.program_by_id[rule.program_id];
                if (!program.rules) {
                    program.rules = [];
                }
                program.rules.push(rule);
            });
        },
    },
    {
        model: 'loyalty.reward',
        fields: ['program_id', 'reward_type', 'required_points', 'clear_wallet', 'currency_id',
            'discount', 'discount_mode', 'discount_applicability', 'discount_product_ids',
            'discount_max_amount', 'discount_line_product_id',
            'multi_product', 'reward_product_ids', 'reward_product_qty', 'reward_product_uom_id'],
        domain: function(self) {
            return [['program_id', 'in', self.config.all_program_ids]];
        },
        loaded: function(self, rewards) {
            self.rewards = rewards;
            self.reward_by_id = Object.fromEntries(rewards.map((reward) => [reward.id, reward]));
            rewards.forEach((reward) => {
                program = self.program_by_id[reward.program_id];
                if (!program.rewards) {
                    program.rewards = [];
                }
                program.rewards.push(reward);
            });
        },
    },
    {
        model: product_model.model,
        fields: product_model.fields,
        order: product_model.order,
        domain: function (self) {
            // Collect all ids we care about
            product_ids = self.rules.map((rule) => rule.valid_product_ids);
            self.rewards.forEach((reward) => {
                reward_product_ids.concat(
                    reward.discount_product_ids, [reward.discount_line_product_id], reward.reward_product_ids);
            });
            return [['id', 'in', product_ids]];
        },
        context: product_model.context,
        loaded: product_model.loaded,
    },
]);

//TODO: do we need this?
class Coupon {
    /**
     * @param {string} code coupon code
     * @param {number} coupon_id id of loyalty.card, leave empty if it does not exist
     * @param {number} program_id id of loyalty.program
     * @param {number} partner_id id of res.partner
     * @param {number} balance points on the coupon, 0 most of the time
     */
    constructor(code, coupon_id, program_id, partner_id, balance) {
        this.code = code;
        this.coupon_id = coupon_id;
        this.program_id = program_id;
        this.partner_id = partner_id;
        this.balance = balance;
    }
}

const _orderline_super = models.Orderline.prototype;
models.Orderline = models.Orderline.extend({
    export_as_JSON: function () {
        const result = _orderline_super.export_as_JSON.apply(this);
        result.is_reward_line = this.is_reward_line;
        // If it is a manual reward we do not blacklist the reward if it is removed.
        result.manual_reward = this.manual_reward;
        result.reward_id = this.reward_id;
        result.coupon_id = this.coupon_id;
        result.reward_identifier_code = this.reward_identifier_code;
        result.points_cost = this.points_cost;
        result.giftBarcode = this.giftBarcode;
        return result;
    },
    init_from_JSON: function (json) {
        if (json.is_reward_line) {
            this.is_reward_line = json.is_reward_line;
            this.manual_reward = json.manual_reward;
            this.reward_id = json.reward_id;
            this.coupon_id = json.coupon_id;
            this.reward_identifier_code = json.reward_identifier_code;
            this.points_cost = json.points_cost;
            this.giftBarcode = json.giftBarcode;
            this.tax_ids = json.tax_ids[0][2];
        }
        _orderline_super.init_from_JSON.apply(this, [json]);
    },
});

const _posmodel_super = models.PosModel.prototype;
models.PosModel = models.PosModel.extend({
    initialize: function () {
        _posmodel_super.initialize.apply(this, arguments);
        this.couponCache = [];
        this.ready.then(() => {
            if (this.get('selectedOrder')) {
                this.get('selectedOrder').trigger('update-rewards');
            }
        });
    },
});

const _order_super = models.Order.prototype;
models.Order = models.Order.extend({
    initialize: function () {
        const res = _order_super.initialize.apply(this, arguments);
        res.on('update-rewards', () => {
            if (!this.pos.config.all_program_ids.length) {
                return;
            }
            // NOTE: this is not sync
            this._trigger_reward_update();
        }, res);
        res.on('reset-coupons', res.resetCoupons, res);
        res._initialize_programs();
        return res;
    },
    export_as_JSON: function () {
        const json = _order_super.export_as_JSON.apply(this, arguments);
        json.disabledPrograms = this.disabledPrograms;
        json.codeActivatedPrograms = this.codeActivatedPrograms;
        json.codeActivatedCoupons = this.codeActivatedCoupons;
        json.couponPointChanges = this.couponPointChanges;
        json.nextCouponIdx = this.nextCouponIdx;
        return json;
    },
    init_from_json: function (json) {
        _order_super.init_from_JSON.apply(this, arguments);
        this.disabledPrograms = json.disabledPrograms;
        this.codeActivatedPrograms = json.codeActivatedPrograms;
        this.codeActivatedCoupons = json.codeActivatedCoupons;
        this.couponPointChanges = json.couponPointChanges;
        this.nextCouponIdx = json.nextCouponIdx;
    },
    set_client: function (client) {
        const oldClient = this.get_client();
        // NOTE: maybe we should have a popup saying some rewards will be lost?
        _order_super.set_client.apply(this, arguments);
        if (oldClient !== this.get_client()) {
            this._trigger_reward_update();
        }
    },
    wait_for_push_order: function () {
        return (this.couponPointChanges.length || this._get_reward_lines().length || _order_super.wait_for_push_order.apply(this, arguments));
    },
    export_for_printing: function () {
        const result = _order_super.export_for_printing.apply(this, arguments);
        //TODO: add new coupons for the receipt
        return result;
    },

    get_orderlines: function () {
        const orderLines = _order_super.get_orderlines.apply(this, arguments);
        // Sort orderlines to have rewards at the bottom.
        orderLines.sort((line_1, line_2) => {
            return (line_1.is_reward_line === line_2.is_reward_line) ? 0 : line_1.is_reward_line ? 1 : -1
        });
        return orderLines;
    },
    _get_reward_lines: function () {
        return this.get_orderlines().filter((line) => line.is_reward_line);
    },
    _get_regular_order_lines: function () {
        return this.get_orderlines().filter((line) => !line.is_reward_line && !line.refunded_orderline_id);
    },
    get_last_orderline: function () {
        const regularLines = this._get_regular_order_lines();
        if (regularLines.length) {
            return regularLines[regularLines.length - 1];
        }
        return undefined;
    },
    set_orderline_options: function (line, options) {
        _order_super.set_orderline_options.apply(this, arguments);
        if (options && options.is_reward_line) {
            line.is_reward_line = options.is_reward_line;
            line.manual_reward = options.manual_reward;
            line.reward_id = options.reward_id
            line.coupon_id = options.coupon_id;
            line.reward_identifier_code = options.reward_identifier_code;
            line.points_cost = options.points_cost;
            line.price_manually_set = true;
        }
    },
    add_product: function (product, options) {
        _order_super.add_product.apply(this, arguments);
        this.trigger('update-rewards');
    },

    _initialize_programs: async function () {
        // When deleting a reward line, a popup will be displayed if the reward was automatic,
        //  if confirmed the program is added here and will not be added to the order again until a reset.
        this.disabledPrograms = [];
        // List of programs that require a code that are activated.
        this.codeActivatedPrograms = [];
        // List of coupons (code of the coupon)
        this.codeActivatedCoupons = [];
        // This field will hold the added points for each coupon.
        // Points lost are directly linked to the order lines.
        this.couponPointChanges = {};
    },
    reset_programs: function () {
        this.disabledRewards = [];
        this.codeActivatedPrograms = [];
        this.codeActivatedCoupons = [];
        this.couponPointChanges = {};
        this.orderlines = this.orderlines.remove(this._get_reward_lines());
    },
    _trigger_reward_update: function (options) {
        dp.add(this._update_rewards(options)).catch(() => {/* catch the reject of dp when calling `add` to avoid unhandledrejection */});
    },
    _create_line_from_vals(vals) {
        const line = new models.Orderline({}, {pos: this.pos, order: this, product: vals['product']});
        this.fix_tax_included_price(line);
        this.set_orderline_options(line, vals);
        return line;
    },
    _update_rewards: async function (options) {
        // Used with `activate_code`, this is done within this function to maintain thread safety for these operations
        if (options['registerNewCoupon']) {
            const coupon = options['registerNewCoupon'];
            // Nothing changes
            if (this.codeActivatedCoupons.includes(coupon.code)) {
                return;
            }
            this.codeActivatedCoupons.push(coupon.code);
            if (!this.pos.couponCache.find((c) => c.id === coupon.id)) {
                this.pos.couponCache.push(coupon);
            }
        }
        if (options['activateProgram']) {
            this.codeActivatedPrograms.push(options['activateProgram']);
        }

        await this._compute_points_changes();
        await this._check_update_reward_lines()
        this._rewards_auto_apply();
        this.trigger('rewards-updated');
    },
    _compute_points_changes: async function () {
        const changesPerProgram = {};
        this.couponPointChanges.forEach((pe) => {
            if (!changesPerProgram[pe.program_id]) {
                changesPerProgram[pe.program_id] = [];
            }
            changesPerProgram[pe.program_id].push(pe);
        });
        const lineBarcodes = this._get_regular_order_lines.reduce((line, agg) => {
            if (line.giftBarcode) {
                agg.push(line.giftBarcode);
            }
        }, []);
        this.pos.programs.forEach((program) => {
            // Future programs may split their points per unit paid (gift cards for example)
            const pointsAdded = this._points_for_program(program);
            // For programs that apply to both (loyalty) we always have a change of 0 points since it makes it easier to
            //  track for claimable rewards
            if (program.applies_on == 'both' && !pointsAdded.length) {
                pointsAdded.push(0);
            }
            const oldChanges = changesPerProgram[program.id];
            // Update point changes for those that exist
            for (let idx = 0; idx < Math.min(pointsAdded.length, oldChanges.length); idx++) {
                oldChanges[idx].points = pointsAdded[idx];
            }
            if (pointsAdded.length < oldChanges.length) {
                const toKeep = pointsAdded.length;
                let visited = 0;
                this.couponPointChanges = this.couponPointChanges.filter((pe) => {
                    const sameProgram = (pe.program_id == program.id)
                    // Remove any point change for a barcode that is not present in the lines aswell
                    if (!sameProgram || visited < toKeep && (!pe.barcode || lineBarcodes.includes(pe.barcode))) {
                        visited += sameProgram;
                        return true;
                    }
                    return false;
                });
            } else if (pointsAdded.length > oldChanges.length) {
                pointsAdded.splice(oldChanges.length).forEach((pa) => {
                    coupon = this._coupon_for_program(program);
                    this.couponPointChanges.push({
                        points: pa,
                        program_id: program.id,
                        coupon_id: coupon.id,
                        barcode: false,
                    });
                });
            }
        });
    },
    /**
     * @returns {number} The points that are left for the given coupon for this order.
     */
    _get_real_coupon_points: function (coupon_id) {
        let points = 0;
        const dbCoupon = this.pos.couponCache.find((coupon) => coupon.id === coupon_id);
        if (dbCoupon) {
            points += dbCoupon;
        }
        for (const pe of this.couponPointChanges) {
            if (pe.coupon_id === coupon_id) {
                if (this.pos.program_by_id[pe.program_id].applies_on !== 'future') {
                    points += pe.points;
                }
                // couponPointChanges is not supposed to have a coupon multiple times
                break;
            }
        }
        this.get_orderlines().forEach((line) => {
            if (line.is_reward_line && line.coupon_id === coupon_id) {
                points -= line.points_cost;
            }
        });
        return points
    },
    /**
     * @returns {number} A negative id used to identify local coupons (created on this order).
     */
    _next_local_coupon_id: function () {
        if (!this.nextCouponIdx) {
            this.nextCouponIdx = -1;
        }
        return this.nextCouponIdx--;
    },
    /**
     * Checks the cache for the card or fetches it if it does not exist yet.
     * If both of those don't find a card, a new (local) one is created.
     *
     * @param {object} program
     */
    _fetch_loyalty_card: async function (program) {
        const clientId = this.get_client().id;
        let coupon = this.pos.couponCache.find((coupon) => {
            return coupon.partner_id === clientId && coupon.program_id === program.id;
        });
        if (!coupon) {
            const dbCoupon = await this.pos.rpc({
                model: 'loyalty.card',
                method: 'search_read',
                kwargs: {
                    domain: [['partner_id', '=', clientId], ['program_id', '=', program.id]],
                    fields: ['id', 'points', 'code'],
                    limit: 1,
                    context: session.user_context
                },
            });
            if (dbCoupon) {
                coupon = new Coupon(dbCoupon.code, dbCoupon.id, program.id, clientId, dbCoupon.points);
            } else {
                // TODO: make sure the cache is updated upon validating the order
                coupon = new Coupon(null, this._next_local_coupon_id(), program.id, clientId, 0);
            }
            this.pos.couponCache.push(coupon);
        }
        return coupon;
    },
    /**
     * Depending on the program type returns a new (local) instance of coupon or tries to retrieve the coupon in case of loyalty cards.
     * Existing coupons are put in a cache which is also used to fetch the coupons.
     *
     * @param {object} program
     */
    _coupon_for_program: async function (program) {
        if (program.applies_on === 'both') {
            return this._fetch_loyalty_card(program);
        }
        // This type of coupons don't need to really exist up until validating the order, so no need to cache
        return new Coupon(null, this._next_local_coupon_id(), program.id, this.get_client().id, 0);
    },
    _program_applicable: function (program) {
        if ((program.trigger !== 'auto' && !(program.id in this.codeActivatedPrograms)) || program.id in this.disabledPrograms) {
            return false;
        }
        return true;
    },
    _points_for_program: function (program) {
        // Programs that are not applicable simply return an empty array 
        if (!this._program_applicable(program)) {
            return [];
        }
        let points = 0;
        const splitPoints = [];
        const totalTaxed = this.get_total_with_tax();
        const totalUntaxed = this.get_total_without_tax();
        const orderLines = this._get_regular_order_lines()
        program.rules.forEach((rule) => {
            const min = rule.minimum_amount; // NOTE: this does not handle currency conversion
            if (rule.minimum_amount_tax_mode === 'incl' && min > (totalTaxed) || min > totalUntaxed) { // NOTE: big doutes par rapport au fait de compter tous les produits
                return;
            }
            let orderedProductQty = 0;
            let orderedProductPaid = 0
            orderLines.forEach((line) => {
                if ((rule.any_product || line.get_product().id in rule.valid_product_ids) && !line.is_reward_line) {
                    orderedProductQty += line.get_quantity();
                    const priceTaxed = line.get_price_with_tax();
                    if (priceTaxed > 0) {
                        orderedProductPaid += line.get_price_with_tax();
                    }
                }
            });
            if (orderedProductQty < rule.minimum_qty) {
                return;
            }
            if (program.applies_on === 'future' && rule.reward_point_trigger_multi && rule.reward_point_mode !== 'order') {
                // In this case we add on to the global point count
                if (rule.reward_point_mode === 'unit') {
                    splitPoints.concat(Array.apply(null, Array(orderedProductQty)).map(() => rule.reward_point_amount));
                } else if (rule.reward_point_mode === 'money') {
                    orderLines.forEach((line) => {
                        if (line.is_reward_line || !(line.get_product().id in rule.valid_product_ids) || line.get_quantity() <= 0) {
                            return;
                        }
                        const pointsPerUnit = round_precision(rule.reward_point_amount * line.get_price_with_tax() / line.get_quantity(), 0.01);
                        if (pointsPerUnit > 0) {
                            splitPoints.concat(Array.apply(null, Array(line.get_quantity)).map(() => pointsPerUnit));
                        }
                    });
                }
            } else {
                // In this case we count the points per rule
                if (rule.reward_point_mode === 'order') {
                    points += rule.reward_point_amount
                } else if (rule.reward_point_mode === 'money') {
                    // NOTE: unlike in sale_loyalty this performs a round half-up instead of round down
                    points += round_precision(rule.reward_point_amount * orderedProductPaid, 0.01);
                } else if (rule.reward_point_mode === 'unit') {
                    points += rule.reward_point_amount * orderedProductQty;
                }
            }
        });
        const res = points ? [points] : [];
        if (splitPoints.length) {
            res.concat(splitPoints);
        }
        return res;
    },
    _check_update_reward_lines: async function () {
        const processedRewards = {};
        const linesToRemove = [];
        const linesToAdd = [];
        const orderLines = this.get_orderlines()
        orderLines.forEach((line) => {
            if (!line.coupon_id || !line.reward_id ||
                [line.reward_id, line.coupon_id, line.reward_identifier_code] in processed_rewards) {
                    return;
            }
            processedRewards[[line.reward_id, line.coupon_id, line.reward_identifier_code]] = true;
            let additionalPoints = line.points_cost;
            const concernedLines = orderLines.filter((oLine) => {
                if (oLine.reward_id === line.reward_id &&
                        oLine.coupon_id === line.coupon_id &&
                        oLine.reward_identifier_code === line.reward_identifier_code) {
                    additionalPoints += oLine.points_cost;
                    return true;
                }
                return false;
            });
            const points = this._get_real_coupon_points(line.coupon_id) + additionalPoints;
            const reward = this.pos.reward_by_id[line.reward_id];
            const program = this.pos.program_by_id[reward.program_id];
            if (points < reward.required_points || !this._program_applicable(program)) {
                linesToRemove.concat([line], concernedLines);
            } else {
                const values_list = this._get_reward_line_values(
                    {reward: reward, coupon_id: line.coupon_id, additionalPoints: additionalPoints, product=line.get_product()});
                for (const vals of values_list) {
                    delete vals.reward_identifier_code;
                }
                if (values_list.length == 1 && concernedLines.length == 1) {
                    Object.assign(concernedLines[0], values_list[0]);
                } else {
                    let concernedLinesToRemove = [...concernedLines];
                    for (const vals of values_list) {
                        const taxesKey = vals['tax_ids'].join(',');
                        let foundLine = false;
                        for (const value_line of concernedLines) {
                            const lineTaxesKey = line.get_taxes().map((tax) => tax.id).join(',')
                            if (taxesKey === lineTaxesKey) {
                                foundLine = true;
                                if (vals['quantity'] && vals['unit_price']) {
                                    Object.assign(value_line, vals);
                                    concernedLinesToRemove = concernedLinesToRemove.splice(
                                        concernedLinesToRemove.findIndex((l) => l === value_line), 1);
                                }
                            }
                        }
                        if (!foundLine) {
                            linesToAdd.add(this._create_line_from_vals(vals));
                        }
                    }
                    linesToRemove.concat(concernedLinesToRemove);
                }
            }
        });
        this.orderlines.remove(linesToRemove);
        this.orderlines.add(linesToAdd);
    },
    _apply_reward: function(reward, coupon_id, args) {
        if (this._get_real_coupon_points(coupon_id) < reward.required_points) {
            //TODO: return an error? do we need feedback?
            return false;
        }
        const manualReward = {manual_reward: args['manual_reward'] || false};
        const rewardLines = this._get_reward_line_values({
            reward: reward,
            coupon_id: coupon_id,
            additionalPoints: args['additionalPoints'] || 0,
            product: args['product'] || null,
        }).map((vals) => this._create_line_from_vals(Object.assign(vals, manualReward)));
        this.orderlines.add(rewardLines);
        return true;
    },
    _get_reward_line_values: function (args) {
        const reward = args['reward'];
        if (reward.reward_type === 'discount') {
            return this._get_reward_line_values_discount(args);
        } else if (reward.reward_type === 'product') {
            return this._get_reward_line_values_product(args);
        }
        // NOTE: we may reach this step if for some reason there is a free shipping reward
        return [];
    },
    _get_reward_line_values_discount: function (args) {
        const additionalPoints = args['additionalPoints'] || 0;
        const reward = args['reward'];
        const coupon_id = args['coupon_id'];
        // Defaults to applies on order
        let concernedLines = this._get_regular_order_lines();
        if (reward.discount_applicability === 'cheapest') {
            concernedLines = [concernedLines.reduce(
                (min_line, line) => line.get_lst_price() < min_line.get_lst_price() ? line : min_line, concernedLines[0])
            ];
        } else if (reward.discount_applicability === 'specific') {
            concernedLines = concernedLines.filter((line) => line.get_product().id in reward.discount_product_ids);
        }
        if (!concernedLines) {
            return [];
        }
        let maxDiscount = reward.discount_max_amount || Infinity;
        let concernedLinesTotal;
        if (reward.discount_applicability !== 'cheapest') {
            concernedLinesTotal = concernedLines.reduce((line, acc) => acc += (line.get_lst_price() * line.get_quantity()), 0);
        } else {
            concernedLinesTotal = concernedLines[0].get_lst_price();
        }
        // Update the max discount from the total
        if (reward.discount_mode === 'per_point') {
            maxDiscount = Math.min(maxDiscount, reward.discount * (this._get_real_coupon_points(coupon_id) + additionalPoints));
        } else if (reward.discount_mode === 'per_order') {
            maxDiscount = min(maxDiscount, reward.discount);
        } else if (reward.discount_mode === 'percent') {
            maxDiscount = min(maxDiscount, concerned_lines_total * (reward.discount / 100));
        }
        if (reward.discount_mode === 'per_point' || reward.discount_mode === 'per_order') {
            // Fixed amount discounts
            const toDiscount = min(maxDiscount, concernedLinesTotal);
            let consumedPoints = reward.clear_wallet ? (this._get_real_coupon_points(coupon_id) + additionalPoints) : reward.required_points;
            if (!reward.clear_wallet && reward.discount_mode === 'per_point') {
                consumedPoints = Math.ceil(toDiscount / reward.discount);
            }
            //TODO: handle errors ? (!toDiscount)
            if (!toDiscount) {
                return [];
            }
            return [{
                product: this.pos.db.get_product_by_id(reward.discount_line_product_id),
                unit_price: -toDiscount,
                quantity: 1,
                reward_id: reward.id,
                coupon_id: coupon_id,
                points_cost: consumedPoints,
                tax_ids: [],
                reward_identifier_code: _newRandomRewardCode(),
            }];
        }
        const discountRewards = {}
        const rewardCode = _newRandomRewardCode(),
        const discountFactor = concernedLinesTotal ? min(1, maxDiscount / (concernedLinesTotal * (reward.discount / 100))) : 1;
        for (const line of concernedLines) {
            const lineDiscount = (line.get_quantity() * line.get_lst_price() * (reward.discount / 100)) * discountFactor;
            if (lineDiscount) {
                const key = line.get_taxes().map((tax) => tax.id);
                if (discountRewards[key]) {
                    discountRewards[key]['unit_price'] -= lineDiscount;
                } else {
                    discountRewards[key] = {
                        product: this.pos.db.get_product_by_id(reward.discount_line_product_id),
                        unit_price: -toDiscount,
                        quantity: 1,
                        reward_id: reward.id,
                        coupon_id: coupon_id,
                        points_cost: 0,
                        reward_identifier_code: rewardCode,
                        tax_ids: key,
                    }
                }
            }
        }
        const result = Object.values(discountRewards);
        if (result.length) {
            result[0]['points_cost'] = reward.clear_wallet ? (this._get_real_coupon_points(args['coupon_id']) + additionalPoints) : reward.required_points;
        }
        return result
    },
    _get_reward_line_values_product: function (args) {
        const additionalPoints = args['additionalPoints'] || 0;
        const reward = args['reward'];
        const product = args['product'] || this.pos.db.get_product_by_id(reward.reward_product_ids[0]);
        //TODO: handle errors ? (!product)
        return [{
            product: product,
            unit_price: 0,
            quantity: reward.reward_product_qty,
            reward_id: reward.id,
            coupon_id: args['coupon_id'],
            points_cost: reward.clear_wallet ? (this._get_real_coupon_points(args['coupon_id']) + additionalPoints) : reward.required_points,
            reward_identifier_code: _newRandomRewardCode(),
        }]
    },
    _rewards_auto_apply: function () {
        if (!this.orderlines.length) {
            return;
        }
        // Collect all the coupons that we have to check
        const allCouponPrograms = this.couponPointChanges.map((pe) => {
            return {
                program_id: pe.program_id,
                coupon_id: pe.coupon_id
            };
        }).concat(this.codeActivatedCoupons.map((code) => {
            const coupon = this.pos.couponCache.find((c) => c.code === code);
            return {
                program_id: coupon.program_id,
                coupon_id: coupon.id,
            };
        }));
        for (const couponProgram of allCouponPrograms) {
            if (!couponProgram || !couponProgram.program_id || !couponProgram.coupon_id) {
                continue
            }
            const program = this.program_by_id[couponProgram.program_id];
            // No automatic reward if multiple are available in the program or if loyalty program
            if (program.reward_ids.length > 1 || program.applies_to !== 'current') {
                continue;
            }
            const reward = this.reward_by_id[program.reward_ids[0]];
            if (reward.reward_type === 'product' && reward.multi_product) {
                continue;
            }
            // Apply as long as there are points to be consumed
            while (this._apply_reward(reward, couponProgram.coupon_id, {})) {
                continue;
            }
        }
    },
    __activate_code: async function(code) {
        const program = this.pos.programs.find((program) => program.promo_barcode === code || program.code === code);
        if (program) {
            if (program.id in this.codeActivatedPrograms) {
                return _t('That promo code program has already been activated.');
            }
            this._trigger_reward_update({activateProgram: program.id});
        } else {
            if (this.codeActivatedCoupons.includes(code)) {
                return _t('That coupon code has already been scanned and activated.');
            }
            const customer = this.get_client();
            const { successful, payload } = await this.pos.rpc({
                model: 'pos.config',
                method: 'use_coupon_code',
                args: [
                    [this.pos.config.id],
                    code,
                    this.creation_date,
                    customer ? customer.id : false,
                ],
                kwargs: { context: session.user_context },
            });
            if (successful) {
                this._trigger_reward_update({registerNewCoupon: new Coupon(
                    code, payload.coupon_id, payload.program_id, payload.coupon_partner_id, payload.points)});
            } else {
                return payload.error_message;
            }
        }
        return true;
    },
    activate_code: async function(code) {
        const res = await this.__activate_code(code);
        if (res !== true) {
            Gui.showNotification(res);
        }
    }
}); 
