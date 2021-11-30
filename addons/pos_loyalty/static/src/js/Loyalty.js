/** @odoo-module **/

import { Order, Orderline, PosGlobalState} from 'point_of_sale.models';
import Registries from 'point_of_sale.Registries';
import session from 'web.session';
import concurrency from 'web.concurrency';
import { Gui } from 'point_of_sale.Gui';
import { round_precision } from 'web.utils';
import core from 'web.core';

const _t = core._t;
const dropPrevious = new concurrency.DropPrevious(); // Used for queuing reward updates
const mutex = new concurrency.Mutex(); // Used for sequential cache updates

const COUPON_CACHE_MAX_SIZE = 4096 // Maximum coupon cache size, prevents long run memory issues and (to some extent) invalid data

function _newRandomRewardCode() {
    return (Math.random() + 1).toString(36).substring(3);
}

let nextId = -1;
export class PosLoyaltyCard {
    /**
     * @param {string} code coupon code
     * @param {number} id id of loyalty.card, negative if it is cache local only
     * @param {number} program_id id of loyalty.program
     * @param {number} partner_id id of res.partner
     * @param {number} balance points on the coupon, not counting the order's changes
     */
    constructor(code, id, program_id, partner_id, balance) {
        this.code = code;
        this.id = id || nextId--;
        this.program_id = program_id;
        this.partner_id = partner_id;
        this.balance = balance;
    }
}

const PosLoyaltyGlobalState = (PosGlobalState) => class PosLoyaltyGlobalState extends PosGlobalState {
    async _processData(loadedData) {
        await super._processData(loadedData);
        this.programs = loadedData['loyalty.program'] || []; //TODO: rename to `loyaltyPrograms` etc
        this.rules = loadedData['loyalty.rule'] || [];
        this.rewards = loadedData['loyalty.reward'] || [];
        this.couponCache = {};
        this._loadLoyaltyData();
    }
    _loadLoyaltyData() {
        this.program_by_id = {};
        this.reward_by_id = {};

        for (const program of this.programs) {
            this.program_by_id[program.id] = program;
            if (program.date_to) {
                program.date_to = new Date(program.date_to);
            }
            program.rules = [];
            program.rewards = [];
        }
        for (const rule of this.rules) {
            rule.valid_product_ids = new Set(rule.valid_product_ids);
            rule.program_id = this.program_by_id[rule.program_id[0]];
            rule.program_id.rules.push(rule);
        }
        for (const reward of this.rewards) {
            this.reward_by_id[reward.id] = reward
            reward.program_id = this.program_by_id[reward.program_id[0]];;
            reward.discount_line_product_id = this.db.get_product_by_id(reward.discount_line_product_id[0]);
            reward.all_discount_product_ids = new Set(reward.all_discount_product_ids);
            reward.program_id.rewards.push(reward);
        }
    }
    async load_server_data() {
        await super.load_server_data(...arguments);
        if (this.selectedOrder) {
            this.selectedOrder._updateRewards();
        }
    }
    set_order(order) {
        const result = super.set_order(...arguments);
        // FIXME - JCB: This is a temporary fix.
        // When an order is selected, it doesn't always contain the reward lines.
        // And the list of active programs are not always correct. This is because
        // of the use of DropPrevious in _updateRewards.
        if (order) {
            order._updateRewards();
        }
        return result;
    }
    /**
     * Fetches `loyalty.card` records from the server and adds/updates them in our cache.
     *
     * @param {domain} domain For the search
     * @param {int} limit Default to 1
     */
    async fetchCoupons(domain, limit=1) {
        const result = await this.env.services.rpc({
            model: 'loyalty.card',
            method: 'search_read',
            kwargs: {
                domain: domain,
                fields: ['id', 'points', 'code', 'partner_id', 'program_id'],
                limit: limit,
                context: session.user_context,
            }
        });
        if (Object.keys(this.couponCache).length + result.length > COUPON_CACHE_MAX_SIZE) {
            this.couponCache = {};
            // Make sure that the current order has no invalid data.
            if (this.selectedOrder) {
                this.selectedOrder.invalidCoupons = true;
            }
        }
        const couponList = [];
        for (const dbCoupon of result) {
            const coupon = new PosLoyaltyCard(dbCoupon.code, dbCoupon.id, dbCoupon.program_id[0], dbCoupon.partner_id[0], dbCoupon.points);
            this.couponCache[coupon.id] = coupon;
            couponList.push(coupon);
        }
        return couponList;
    }
    /**
     * Fetches a loyalty card for the given program and client, put in cache afterwards
     *  if a matching card is found in the cache, that one is used instead.
     * If no card is found a local only card will be created until the order is validated.
     *
     * @param {int} programId
     * @param {int} clientId
     */
    async fetchLoyaltyCard(programId, clientId) {
        for (const coupon of Object.values(this.couponCache)) {
            if (coupon.partner_id === clientId && coupon.program_id === programId) {
                return coupon;
            }
        }
        const dbCoupon = await this.fetchCoupons([['partner_id', '=', clientId], ['program_id', '=', programId]])[0];
        return dbCoupon || new PosLoyaltyCard(null, null, programId, clientId, 0);
    }
}
Registries.Model.extend(PosGlobalState, PosLoyaltyGlobalState);

const PosLoyaltyOrderline = (Orderline) => class PosLoyaltyOrderline extends Orderline {
    export_as_JSON() {
        const result = super.export_as_JSON(...arguments);
        result.is_reward_line = this.is_reward_line;
        result.reward_id = this.reward_id;
        result.reward_product_id = this.reward_product_id;
        result.coupon_id = this.coupon_id;
        result.reward_identifier_code = this.reward_identifier_code;
        result.points_cost = this.points_cost;
        result.giftBarcode = this.giftBarcode;
        return result;
    }
    init_from_JSON(json) {
        if (json.is_reward_line) {
            this.is_reward_line = json.is_reward_line;
            this.reward_id = json.reward_id;
            this.reward_product_id = json.reward_product_id;
            this.coupon_id = this.order.oldCouponMapping[json.coupon_id] || json.coupon_id;
            this.reward_identifier_code = json.reward_identifier_code;
            this.points_cost = json.points_cost;
            this.giftBarcode = json.giftBarcode;
        }
        super.init_from_JSON(...arguments);
    }
    set_quantity(quantity, keep_price) {
        if (quantity === 'remove' && this.is_reward_line) {
            // Remove any line that is part of that same reward aswell.
            const linesToRemove = []
            this.order.get_orderlines().forEach((line) => {
                if (line != this &&
                        line.reward_id === this.reward_id &&
                        line.coupon_id === this.coupon_id &&
                        line.reward_identifier_code === this.reward_identifier_code) {
                    linesToRemove.push(line);
                }
            });
            for (const line of linesToRemove) {
                this.order.orderlines.remove(line);
            }
        }
        return super.set_quantity(...arguments);
    }
}
Registries.Model.extend(Orderline, PosLoyaltyOrderline);

const PosLoyaltyOrder = (Order) => class PosLoyaltyOrder extends Order {
    constructor() {
        super(...arguments);
        this._initializePrograms({});
    }
    export_as_JSON() {
        const json = super.export_as_JSON(...arguments);
        json.disabledPrograms = this.disabledPrograms;
        json.codeActivatedProgramRules = this.codeActivatedProgramRules;
        json.codeActivatedCoupons = this.codeActivatedCoupons;
        json.couponPointChanges = this.couponPointChanges;
        return json;
    }
    init_from_JSON(json) {
        this.couponPointChanges = json.couponPointChanges;
        // Remapping of coupon_id for both couponPointChanges and Orderline.coupon_id
        this.oldCouponMapping = {};
        if (this.couponPointChanges) {
            for (const pe of Object.values(this.couponPointChanges)) {
                if (pe.coupon_id > 0) {
                    continue;
                }
                const newId = nextId--;
                delete this.oldCouponMapping[pe.coupon_id];
                pe.coupon_id = newId;
                this.couponPointChanges[newId] = pe;
            }
        }
        super.init_from_JSON(...arguments);
        delete this.oldCouponMapping;
        this.disabledPrograms = json.disabledPrograms;
        this.codeActivatedProgramRules = json.codeActivatedProgramRules;
        this.codeActivatedCoupons = json.codeActivatedCoupons;
        this.invalidCoupons = true;
    }
    set_client(client) {
        const oldClient = this.get_client();
        super.set_client(...arguments);
        if (oldClient !== this.get_client()) {
            this._updateRewards();
        }
    }
    wait_for_push_order() {
        return (!_.isEmpty(this.couponPointChanges) || this._get_reward_lines().length || super.wait_for_push_order(...arguments));
    }
    export_for_printing() {
        const result = super.export_for_printing(...arguments);
        //TODO: add gift cards for the receipt
        if (this.pos.config.loyalty_program_id && this.get_client()) {
            const loyaltyProgram = this.pos.program_by_id[this.pos.config.loyalty_program_id[0]];
            result.loyalty = {
                name: loyaltyProgram.name,
                client: this.get_client().name,
                newPoints: this.getLoyaltyPoints(true),
            };
        }
        result.new_coupon_info = this.new_coupon_info;
        return result;
    }

    get_orderlines() {
        const orderLines = super.get_orderlines(...arguments);
        // Sort orderlines to have rewards at the bottom.
        if (orderLines) {
            orderLines.sort((line_1, line_2) => {
                return (line_1.is_reward_line === line_2.is_reward_line) ? 0 : line_1.is_reward_line ? 1 : -1
            });
        }
        return orderLines;
    }
    _get_reward_lines() {
        const orderLines = super.get_orderlines(...arguments);
        if (orderLines) {
            return orderLines.filter((line) => line.is_reward_line);
        }
        return orderLines;
    }
    _get_regular_order_lines() {
        const orderLines = super.get_orderlines(...arguments);
        if (orderLines) {
            return orderLines.filter((line) => !line.is_reward_line && !line.refunded_orderline_id);
        }
        return orderLines;
    }
    get_last_orderline() {
        const orderLines = super.get_orderlines(...arguments).filter((line) => !line.is_reward_line);
        return orderLines[orderLines.length - 1];
    }
    set_orderline_options(line, options) {
        super.set_orderline_options(...arguments);
        if (options && options.is_reward_line) {
            line.is_reward_line = options.is_reward_line;
            line.reward_id = options.reward_id;
            line.reward_product_id = options.reward_product_id;
            line.coupon_id = options.coupon_id;
            line.reward_identifier_code = options.reward_identifier_code;
            line.points_cost = options.points_cost;
            line.price_manually_set = true;
        }
        line.giftBarcode = options.giftBarcode;
    }
    add_product(product, options) {
        super.add_product(...arguments);
        this._updateRewards();
    }

    async _initializePrograms() {
        // When deleting a reward line, a popup will be displayed if the reward was automatic,
        //  if confirmed the program is added here and will not be added to the order again until a reset.
        if (!this.disabledPrograms) {
            this.disabledPrograms = [];
        }
        // List of programs that require a code that are activated.
        if (!this.codeActivatedProgramRules) {
            this.codeActivatedProgramRules = [];
        }
        // List of coupons activated manually
        if (!this.codeActivatedCoupons) {
            this.codeActivatedCoupons = [];
        }
        // This field will hold the added points for each coupon.
        // Points lost are directly linked to the order lines.
        if (!this.couponPointChanges) {
            this.couponPointChanges = {};
        }
    }
    _resetPrograms() {
        this.disabledPrograms = [];
        this.codeActivatedProgramRules = [];
        this.codeActivatedCoupons = [];
        this.couponPointChanges = {};
        this.orderlines.remove(this._get_reward_lines());
        this._updateRewards();
    }
    _updateRewards() {
        // Calls are not expected to take some time besides on the first load + when loyalty programs are made applicable
        if (this.pos.programs.length === 0) {
            return;
        }
        dropPrevious.add(this._updateLoyaltyPrograms()).then(() => {
            this._updateRewardLines();
        }).catch((ex) => {/* catch the reject of dp when calling `add` to avoid unhandledrejection */});
    }
    async _updateLoyaltyPrograms() {
        await this._checkMissingCoupons();
        await this._updatePrograms();
    }
    async _checkMissingCoupons() {
        // This function must stay sequential to avoid potential concurrency errors.
        await mutex.exec(async () => {
            if (!this.invalidCoupons) {
                return;
            }
            this.invalidCoupons = false;
            const allCoupons = [];
            for (const pe of Object.values(this.couponPointChanges)) {
                if (pe.coupon_id > 0) {
                    allCoupons.push(pe.coupon_id);
                }
            }
            allCoupons.push(...this.codeActivatedCoupons.map((coupon) => coupon.id));
            const couponsToFetch = allCoupons.filter((elem) => !this.pos.couponCache[elem]);
            if (couponsToFetch.length) {
                await this.pos.fetchCoupons([['id', 'in', couponsToFetch]], couponsToFetch.length);
                // Remove coupons that could not be loaded from the db
                this.codeActivatedCoupons = this.codeActivatedCoupons.filter((coupon) => this.pos.couponCache[coupon.id]);
                this.couponPointChanges = Object.fromEntries(Object.entries(this.couponPointChanges).filter((k, pe) => this.pos.couponCache[pe.coupon_id]));
            }
        });
    }
    /**
     * Refreshes the currently applied rewards, if they are not applicable anymore they are removed.
     */
    _updateRewardLines() {
        if (!this.orderlines.length) {
            return;
        }
        const rewardLines = this._get_reward_lines();
        if (!rewardLines.length) {
            return;
        }
        const claimedRewards = [];
        const paymentRewards = []; // Gift card and ewallet rewards are considered payments and must stay at the end
        for (const line of rewardLines) {
            const claimedReward = {
                reward: this.pos.reward_by_id[line.reward_id],
                coupon_id: line.coupon_id,
                args: {
                    product: line.reward_product_id,
                }
            }
            if (claimedReward.reward.program_id.program_type === 'gift_card' || claimedReward.reward.program_id.program_type === 'ewallet') {
                paymentRewards.push(claimedReward);
            } else if (claimedReward.reward.reward_type === 'product') {
                claimedRewards.unshift(claimedReward);
            } else {
                claimedRewards.push(claimedReward);
            }
            this.orderlines.remove(line);
        }
        claimedRewards.push(...paymentRewards);
        for (const claimedReward of claimedRewards) {
            // For existing coupons check that they are still claimed, they can exist in either `couponPointChanges` or `codeActivatedCoupons`
            if (!this.codeActivatedCoupons.find((coupon) => coupon.id === claimedReward.coupon_id) &&
                !this.couponPointChanges[claimedReward.coupon_id]) {
                continue;
            }
            this._applyReward(claimedReward.reward, claimedReward.coupon_id, claimedReward.args);
        }
    }
    async _updatePrograms() {
        const changesPerProgram = {};
        const programsToCheck = new Set();
        // By default include all programs that are considered 'applicable'
        for (const program of this.pos.programs) {
            if (this._programIsApplicable(program)) {
                programsToCheck.add(program.id);
            }
        }
        for (const pe of Object.values(this.couponPointChanges)) {
            if (!changesPerProgram[pe.program_id]) {
                changesPerProgram[pe.program_id] = [];
                programsToCheck.add(pe.program_id);
            }
            changesPerProgram[pe.program_id].push(pe);
        }
        for (const coupon of this.codeActivatedCoupons) {
            programsToCheck.add(coupon.program_id);
        }
        const programs = [...programsToCheck].map((programId) => this.pos.program_by_id[programId]);
        const pointsAddedPerProgram = this.pointsForPrograms(programs);
        for (const program of this.pos.programs) {
            // Future programs may split their points per unit paid (gift cards for example), consider a non applicable program to give no points
            const pointsAdded = this._programIsApplicable(program) ? pointsAddedPerProgram[program.id] : [];
            // For programs that apply to both (loyalty) we always add a change of 0 points, if there is none, since it makes it easier to
            //  track for claimable rewards, and makes sure to load the client's loyalty card.
            if (program.is_nominative && !pointsAdded.length && this.get_client()) {
                pointsAdded.push({points: 0});
            }
            const oldChanges = changesPerProgram[program.id] || [];
            // Update point changes for those that exist
            for (let idx = 0; idx < Math.min(pointsAdded.length, oldChanges.length); idx++) {
                Object.assign(oldChanges[idx], pointsAdded[idx]);
            }
            if (pointsAdded.length < oldChanges.length) {
                const removedIds = oldChanges.map((pe) => pe.coupon_id);
                this.couponPointChanges = Object.fromEntries(Object.entries(this.couponPointChanges).filter(([k, pe]) => {
                    return !removedIds.includes(pe.coupon_id);
                }));
            } else if (pointsAdded.length > oldChanges.length) {
                for (const pa of pointsAdded.splice(oldChanges.length)) {
                    const coupon = await this._couponForProgram(program);
                    this.couponPointChanges[coupon.id] = {
                        points: pa.points,
                        program_id: program.id,
                        coupon_id: coupon.id,
                        barcode: pa.barcode,
                    };
                }
            }
        }
        // Also remove coupons from codeActivatedCoupons if their program applies_on current orders and the program does not give any points
        this.codeActivatedCoupons = this.codeActivatedCoupons.filter((coupon) => {
            const program = this.pos.program_by_id[coupon.program_id];
            if (program.applies_on === 'current' && pointsAddedPerProgram[program.id].length === 0) {
                return false;
            }
            return true;
        });
    }
    /**
     * @param {Boolean} postValidate Whether it is called after the order has been validated in DB or not
     * @returns {Object} containing the following keys: `won`, `spent` and `total`
     */
    getLoyaltyPoints(postValidate=false) {
        let won = 0;
        let spent = 0;
        let total = 0;
        const client = this.get_client();
        if (client && this.pos.config.loyalty_program_id) {
            const loyaltyProgramId = this.pos.config.loyalty_program_id[0];
            const coupon = Object.values(this.pos.couponCache).find((coupon) => coupon.program_id === loyaltyProgramId && coupon.partner_id === client.id);
            let couponId = 0;
            let balance = 0;
            if (coupon) {
                couponId = coupon.id;
                balance = coupon.balance;
            }
            for (const pe of Object.values(this.couponPointChanges)) {
                if (pe.program_id === loyaltyProgramId) {
                    if (couponId === 0) {
                        couponId = pe.coupon_id;
                    }
                    won += pe.points;
                    break;
                }
            }
            if (couponId !== 0) {
                for (const line of this._get_reward_lines()) {
                    if (line.coupon_id === couponId) {
                        spent += line.points_cost;
                    }
                }
            }
            if (postValidate && coupon) {
                total = coupon.balance;
            } else {
                total = balance + won - spent;
            }
        }
        return {
            won: round_precision(won, 0.01),
            spent: round_precision(spent, 0.01),
            total: round_precision(total, 0.01),
        }
    }
    /**
     * @returns {number} The points that are left for the given coupon for this order.
     */
    _getRealCouponPoints(coupon_id) {
        let points = 0;
        const dbCoupon = this.pos.couponCache[coupon_id];
        if (dbCoupon) {
            points += dbCoupon.balance;
        }
        Object.values(this.couponPointChanges).some((pe) => {
            if (pe.coupon_id === coupon_id) {
                if (this.pos.program_by_id[pe.program_id].applies_on !== 'future') {
                    points += pe.points;
                }
                // couponPointChanges is not supposed to have a coupon multiple times
                return true;
            }
            return false
        });
        for (const line of this.get_orderlines()) {
            if (line.is_reward_line && line.coupon_id === coupon_id) {
                points -= line.points_cost;
            }
        }
        return points
    }
    /**
     * Depending on the program type returns a new (local) instance of coupon or tries to retrieve the coupon in case of loyalty cards.
     * Existing coupons are put in a cache which is also used to fetch the coupons.
     *
     * @param {object} program
     */
    async _couponForProgram(program) {
        if (program.is_nominative) {
            return this.pos.fetchLoyaltyCard(program.id, this.get_client().id);
        }
        // This type of coupons don't need to really exist up until validating the order, so no need to cache
        return new PosLoyaltyCard(null, null, program.id, (this.get_client() || {id: -1}).id, 0);
    }
    _programIsApplicable(program) {
        if (this.disabledPrograms.includes(program.id)) {
            return false;
        }
        if (program.trigger === 'auto' && !program.rules.find((rule) => rule.mode === 'auto' || this.codeActivatedProgramRules.includes(rule.id))) {
            return false;
        }
        if (program.trigger === 'with_code' && !program.rules.find((rule) => this.codeActivatedProgramRules.includes(rule.id))) {
            return false;
        }
        if (program.is_nominative && !this.get_client()) {
            return false;
        }
        if (program.date_to && program.date_to <= new Date()) {
            return false;
        }
        if (program.limit_usage && program.total_order_count >= program.max_usage) {
            return false;
        }
        return true;
    }
    pointsForPrograms(programs) {
        const totalTaxed = this.get_total_with_tax();
        const totalUntaxed = this.get_total_without_tax();
        const totalsPerProgram = Object.fromEntries(programs.map((program) => [program.id, {'untaxed': totalUntaxed, 'taxed': totalTaxed}]));
        const orderLines = this.get_orderlines();
        for (const line of orderLines) {
            if (!line.reward_id) {
                continue;
            }
            const reward = this.pos.reward_by_id[line.reward_id];
            if (reward.reward_type !== 'discount') {
                continue;
            }
            const rewardProgram = reward.program_id;
            for (const program of programs) {
                // Remove automatic discount and this program's discounts from the totals.
                if (program.id === rewardProgram.id || rewardProgram.trigger === 'auto') {
                    totalsPerProgram[program.id]['taxed'] -= line.get_price_with_tax();
                    totalsPerProgram[program.id]['untaxed'] -= line.get_price_without_tax();
                }
            }
        }
        const result = {}
        for (const program of programs) {
            let points = 0;
            const splitPoints = [];
            for (const rule of program.rules) {
                if (rule.mode === 'with_code' && !this.codeActivatedProgramRules.includes(rule.id)) {
                    continue;
                }
                const amountCheck = rule.minimum_amount_tax_mode === 'incl' && totalsPerProgram[program.id]['taxed'] || totalsPerProgram[program.id]['untaxed'];
                if (rule.minimum_amount > amountCheck) { // NOTE: big doutes par rapport au fait de compter tous les produits
                    continue;
                }
                let totalProductQty = 0;
                // Only count points for paid lines.
                const qtyPerProduct = {};
                let orderedProductPaid = 0;
                for (const line of orderLines) {

                    if ((!line.reward_product_id && (rule.any_product || rule.valid_product_ids.has(line.get_product().id))) ||
                        (line.reward_product_id && (rule.any_product || rule.valid_product_ids.has(line.reward_product_id)))) {
                        // We only count reward products from the same program to avoid unwanted feedback loops
                        if (line.reward_product_id) {
                            const reward = this.pos.reward_by_id[line.reward_id];
                            if (program.id !== reward.program_id) {
                                continue;
                            }
                        }
                        const lineQty = (line.reward_product_id ? -line.get_quantity() : line.get_quantity());
                        totalProductQty += lineQty;
                        if (qtyPerProduct[line.reward_product_id || line.get_product().id]) {
                            qtyPerProduct[line.reward_product_id || line.get_product().id] += lineQty;
                        } else {
                            qtyPerProduct[line.reward_product_id || line.get_product().id] = lineQty;
                        }
                        orderedProductPaid += line.get_price_with_tax();
                    }
                }
                if (totalProductQty < rule.minimum_qty) {
                    continue;
                }
                if (program.applies_on === 'future' && rule.reward_point_split && rule.reward_point_mode !== 'order') {
                    // In this case we count the points per rule
                    if (rule.reward_point_mode === 'unit') {
                        splitPoints.push(...Array.apply(null, Array(totalProductQty)).map((_) => {return {points: rule.reward_point_amount}}));
                    } else if (rule.reward_point_mode === 'money') {
                        for (const line of orderLines) {
                            if (line.is_reward_line || !(rule.valid_product_ids.has(line.get_product().id)) || line.get_quantity() <= 0) {
                                continue;
                            }
                            const pointsPerUnit = round_precision(rule.reward_point_amount * line.get_price_with_tax() / line.get_quantity(), 0.01);
                            if (pointsPerUnit > 0) {
                                splitPoints.push(...Array.apply(null, Array(line.get_quantity())).map(() => {
                                    if (line.giftBarcode && line.get_quantity() == 1) {
                                        return {points: pointsPerUnit, barcode: line.giftBarcode};
                                    }
                                    return {points: pointsPerUnit}
                                }));
                            }
                        }
                    }
                } else {
                    // In this case we add on to the global point count
                    if (rule.reward_point_mode === 'order') {
                        points += rule.reward_point_amount;
                    } else if (rule.reward_point_mode === 'money') {
                        // NOTE: unlike in sale_loyalty this performs a round half-up instead of round down
                        points += round_precision(rule.reward_point_amount * orderedProductPaid, 0.01);
                    } else if (rule.reward_point_mode === 'unit') {
                        points += rule.reward_point_amount * totalProductQty;
                    }
                }
            }
            const res = points ? [{points}] : [];
            if (splitPoints.length) {
                res.push(...splitPoints);
            }
            result[program.id] = res;
        }
        return result;
    }
    getClaimableRewards(coupon_id=false, program_id=false) {
        const allCouponPrograms = Object.values(this.couponPointChanges).map((pe) => {
            return {
                program_id: pe.program_id,
                coupon_id: pe.coupon_id,
            };
        }).concat(this.codeActivatedCoupons.map((coupon) => {
            return {
                program_id: coupon.program_id,
                coupon_id: coupon.id,
            };
        }));
        const result = [];
        for (const couponProgram of allCouponPrograms) {
            if ((coupon_id && couponProgram.coupon_id !== coupon_id) ||
                (program_id && couponProgram.program_id !== program_id)) {
                continue;
            }
            const program = this.pos.program_by_id[couponProgram.program_id];
            const points = this._getRealCouponPoints(couponProgram.coupon_id);
            for (const reward of program.rewards) {
                if (points >= reward.required_points) {
                    result.push({
                        coupon_id: couponProgram.coupon_id,
                        reward: reward,
                    });
                }
            }
        }
        return result;
    }
    _applyReward(reward, coupon_id, args) {
        if (this._getRealCouponPoints(coupon_id) < reward.required_points) {
            return _t("There are not enough points on the coupon to claim this reward.");
        }
        args = args || {};
        const rewardLines = this._getRewardLineValues({
            reward: reward,
            coupon_id: coupon_id,
            product: args['product'] || null,
        });
        if (!Array.isArray(rewardLines)) {
            return rewardLines; // Returned an error.
        }
        if (!rewardLines.length) {
            return _t("The reward could not be applied.");
        }
        for (const rewardLine of rewardLines) {
            this.orderlines.add(this._createLineFromVals(rewardLine));
        }
        return true;
    }
    _createLineFromVals(vals) {
        vals['lst_price'] = vals['price'];
        const line = Orderline.create({}, {pos: this.pos, order: this, product: vals['product']});
        this.fix_tax_included_price(line);
        this.set_orderline_options(line, vals);
        return line;
    }
    /**
     * @param {loyalty.reward} reward
     * @returns the discountable and discountable per tax for this discount on order reward.
     */
    _getDiscountableOnOrder(reward) {
        let discountable = 0;
        const discountablePerTax = {};
        for (const line of this.get_orderlines()) {
            if (!line.get_quantity()) {
                continue;
            }
            const taxKey = line.get_taxes().map((t) => t.id);
            discountable += line.get_price_with_tax();
            if (!discountablePerTax[taxKey]) {
                discountablePerTax[taxKey] = 0;
            }
            discountablePerTax[taxKey] += line.price * line.get_quantity();
        }
        return {discountable, discountablePerTax};
    }
    /**
     * @returns the order's cheapest line
     */
    _getCheapestLine() {
        let cheapestLine;
        for (const line of this.get_orderlines()) {
            if (line.reward_id || !line.get_quantity()) {
                continue;
            }
            if (!cheapestLine || cheapestLine.price > line.price) {
                cheapestLine = line;
            }
        }
        return cheapestLine;
    }
    /**
     * @param {loyalty.reward} reward
     * @returns the discountable and discountable per tax for this discount on cheapest reward.
     */
    _getDiscountableOnCheapest(reward) {
        const cheapestLine = this._getCheapestLine();
        if (!cheapestLine) {
            return {discountable: 0, discountablePerTax: {}};
        }
        const taxKey = cheapestLine.get_taxes().map((t) => t.id);
        return {discountable: cheapestLine.price, discountablePerTax: Object.fromEntries([[taxKey, cheapestLine.price]])};
    }
    /**
     * @param {loyalty.reward} reward
     * @returns all lines to which the reward applies.
     */
    _getSpecificDiscountableLines(reward) {
        const discountableLines = [];
        const applicableProducts = reward.all_discount_product_ids;
        for (const line of this.get_orderlines()) {
            if (!line.get_quantity()) {
                continue;
            }
            if (applicableProducts.has(line.get_product().id) ||
                applicableProducts.has(line.reward_product_id)) {
                discountableLines.push(line);
            }
        }
        return discountableLines;
    }
    /**
     * For a 'specific' type of discount it is more complicated as we have to make sure that we never
     *  discount more than what is available on a per line basis.
     * @param {loyalty.reward} reward
     * @returns the discountable and discountable per tax for this discount on specific reward.
     */
    _getDiscountableOnSpecific(reward) {
        const applicableProducts = reward.all_discount_product_ids;
        const linesToDiscount = [];
        const discountLinesPerReward = {};
        const orderLines = this.get_orderlines();
        const remainingAmountPerLine = {};
        for (const line of orderLines) {
            if (!line.get_quantity() || !line.price) {
                continue;
            }
            remainingAmountPerLine[line.cid] = line.get_price_with_tax();
            if (applicableProducts.has(line.get_product().id) ||
                applicableProducts.has(line.reward_product_id)) {
                linesToDiscount.push(line);
            } else if (line.reward_id) {
                const lineReward = this.pos.reward_by_id[line.reward_id];
                if (lineReward.id === reward.id) {
                    continue;
                }
                if (!discountLinesPerReward[line.reward_identifier_code]) {
                    discountLinesPerReward[line.reward_identifier_code] = [];
                }
                discountLinesPerReward[line.reward_identifier_code].push(line);
            }
        }

        let cheapestLine = false;
        for (const lines of Object.values(discountLinesPerReward)) {
            const lineReward = this.pos.reward_by_id[lines[0].reward_id];
            let discountedLines = orderLines;
            if (lineReward.discount_applicability === 'cheapest') {
                cheapestLine = cheapestLine || this._getCheapestLine();
                discountedLines = [cheapestLine];
            } else if (lineReward.discount_applicability === 'specific') {
                discountedLines = this._getSpecificDiscountableLines(lineReward);
            }
            if (!discountedLines.length) {
                continue;
            }
            const commonLines = linesToDiscount.filter((line) => discountedLines.includes(line));
            if (lineReward.discount_mode === 'percent') {
                const discount = lineReward.discount / 100;
                for (const line of discountedLines) {
                    if (line.reward_id) {
                        continue;
                    }
                    if (lineReward.discount_applicability === 'cheapest') {
                        remainingAmountPerLine[line.cid] *= (1 - (discount / line.get_quantity()))
                    } else {
                        remainingAmountPerLine[line.cid] *= (1 - discount);
                    }
                }
            } else {
                const nonCommonLines = discountedLines.filter((line) => !linesToDiscount.includes(line));
                let discountedAmount = Math.abs(lines.reduce((sum, line) => sum + line.get_price_with_tax(), 0));
                const process = (line) => {
                    if (!discountedAmount || line.reward_id) {
                        return;
                    }
                    const remaining = remainingAmountPerLine[line.cid];
                    const consumed = Math.min(remaining, discountedAmount);
                    discountedAmount -= consumed;
                    remainingAmountPerLine[line.cid] -= consumed;
                }
                nonCommonLines.forEach(process);
                commonLines.forEach(process);
            }
        }

        let discountable = 0;
        const discountablePerTax = {};
        for (const line of linesToDiscount) {
            discountable += remainingAmountPerLine[line.cid];
            const taxKey = line.get_taxes().map((t) => t.id);
            if (!discountablePerTax[taxKey]) {
                discountablePerTax[taxKey] = 0;
            }
            discountablePerTax[taxKey] += (line.price * line.get_quantity()) * (remainingAmountPerLine[line.cid] / line.get_price_with_tax());
        }
        return {discountable, discountablePerTax};
    }
    _getRewardLineValues(args) {
        const reward = args['reward'];
        if (reward.reward_type === 'discount') {
            return this._getRewardLineValuesDiscount(args);
        } else if (reward.reward_type === 'product') {
            return this._getRewardLineValuesProduct(args);
        }
        // NOTE: we may reach this step if for some reason there is a free shipping reward
        return [];
    }
    _getRewardLineValuesDiscount(args) {
        const reward = args['reward'];
        const coupon_id = args['coupon_id'];
        const rewardAppliesTo = reward.discount_applicability;
        let getDiscountable;
        if (rewardAppliesTo === 'order') {
            getDiscountable = this._getDiscountableOnOrder.bind(this);
        } else if (rewardAppliesTo === 'cheapest') {
            getDiscountable = this._getDiscountableOnCheapest.bind(this);
        } else if (rewardAppliesTo === 'specific') {
            getDiscountable = this._getDiscountableOnSpecific.bind(this);
        }
        if (!getDiscountable) {
            return _t("Unknown discount type");
        }
        let {discountable, discountablePerTax} = getDiscountable(reward);
        discountable = Math.min(this.get_total_with_tax(), discountable);
        if (!discountable) {
            return [];
        }
        let maxDiscount = reward.discount_max_amount || Infinity;
        if (reward.discount_mode === 'per_point') {
            maxDiscount = Math.min(maxDiscount, reward.discount * this._getRealCouponPoints(coupon_id));
        } else if (reward.discount_mode === 'per_order') {
            maxDiscount = Math.min(maxDiscount, reward.discount);
        } else if (reward.discount_mode === 'percent') {
            maxDiscount = Math.min(maxDiscount, discountable * (reward.discount / 100));
        }
        const rewardCode = _newRandomRewardCode();
        let pointCost = reward.clear_wallet ? this._getRealCouponPoints(coupon_id) : reward.required_points;
        if (reward.discount_mode === 'per_point' && !reward.clear_wallet) {
            pointCost = Math.min(maxDiscount, discountable) / reward.discount;
        }
        // These are considered payments and do not require to be either taxed or split by tax
        if (['ewallet', 'gift_card'].includes(reward.program_id.program_type)) {
            return [{
                product: discountProduct,
                price: -Math.min(maxDiscount, discountable),
                quantity: 1,
                reward_id: reward.id,
                is_reward_line: true,
                coupon_id: coupon_id,
                points_cost: pointCost,
                reward_identifier_code: rewardCode,
                merge: false,
            }];
        }
        const discountFactor = discountable ? Math.min(1, (maxDiscount / discountable)) : 1;
        const discountProduct = reward.discount_line_product_id;
        const result = Object.entries(discountablePerTax).reduce((lst, entry) => {
            const taxIds = entry[0] === '' ? [] : entry[0].split(',').map((str) => parseInt(str));
            lst.push({
                product: discountProduct,
                price: -(entry[1] * discountFactor),
                quantity: 1,
                reward_id: reward.id,
                is_reward_line: true,
                coupon_id: coupon_id,
                points_cost: 0,
                reward_identifier_code: rewardCode,
                tax_ids: taxIds,
                merge: false,
            });
            return lst;
        }, []);
        if (result.length) {
            result[0]['points_cost'] = pointCost;
        }
        return result;
    }
    _computeAvailableFreeProduct(reward, coupon_id, product) {
        // Might not be perfect but good enough
        let productPriceWithTax = null;
        const orderlines = this.get_orderlines();
        const program = reward.program_id;
        let freeClaimed = 0;
        let available = 0;
        for (const line of orderlines) {
            if (line.get_product().id === product.id) {
                if (productPriceWithTax === null) {
                    productPriceWithTax = line.get_price_with_tax() / line.get_quantity();
                }
                available += line.get_quantity();
            } else if (line.reward_product_id === product.id) {
                freeClaimed += line.get_quantity();
            }
        }
        // This only applies to programs that apply on current and both orders and only if points are being counted for that coupon.
        const pointChangeEntry = this.couponPointChanges[coupon_id];
        if (available && (pointChangeEntry && program.applies_on === 'current' || program.applies_on === 'both')) {
            /**
             * We have to count the points again in this case because we have to know how much points will be lost
             *  after we apply the free product, take for example a 2+1 free program, you could have 1 points per unit paid
             *  with the reward being the free product that takes 1 point. At the time of counting the points
             *  if you have 2 units in your list you would technically be eligible for the reward since you have enough points.
             * However because claiming the unit would result in a loss of 2 points, you would lose our eligibility.
             * This seams like a small problem but we have to take note that we may also get points from other products and as such they
             *  a free product might not impact the points at all.
             * Example program:
             *  2 rules:
             *    1: 1 point per unit paid on product A.
             *    2 10 points per unit paid on product B.
             *  1 reward:
             *    1: for 2 point, 1 free product A.
             * This means that if we have a product B we are eligible for 5 free product A.
             * But also that we need at least 6 product A before rule 1 starts counting points again.
             * Since reward lines at this point may or may not be present we have to remove the points we compute in this function.
             */
            let points = this._getRealCouponPoints(coupon_id);
            let totalTaxed = this.get_total_with_tax();
            let totalUntaxed = this.get_total_without_tax();
            orderlines.forEach((line) => {
                if (!line.reward_id) {
                    return;
                }
                const lineReward = this.pos.reward_by_id[line.reward_id];
                if (lineReward.reward_type !== 'discount') {
                    return;
                }
                const rewardProgram = lineReward.program_id;
                if (rewardProgram.id === program.id || rewardProgram.trigger === 'auto') {
                    totalTaxed -= line.get_price_with_tax();
                    totalUntaxed -= line.get_price_without_tax();
                }
            });
            // Compute how much one unit costs in terms of points
            const ruleData = [];
            for (const rule of program.rules) {
                if (!rule.any_product && !rule.valid_product_ids.has(product.id)) {
                    continue;
                }
                const amountToCheck = (rule.minimum_amount_tax_mode === 'incl' ? totalTaxed : totalUntaxed);
                if (rule.minimum_amount > amountToCheck) {
                    continue;
                }
                let totalProductQty = 0;
                let orderedProductPaid = 0;
                orderlines.forEach((line) => {
                    if ((!line.reward_product_id && (rule.any_product || rule.valid_product_ids.has(line.get_product().id))) ||
                        (line.reward_product_id && (rule.any_product || rule.valid_product_ids.has(line.reward_product_id)))) {
                        // We only count reward products from the same program to avoid unwanted feedback loops
                        if (line.reward_product_id) {
                            const reward = this.pos.reward_by_id[line.reward_id];
                            if (program.id !== reward.program_id.id) {
                                return;
                            }
                        }
                        const lineQty = (line.reward_product_id ? -line.get_quantity() : line.get_quantity());
                        totalProductQty += lineQty;
                        orderedProductPaid += line.get_price_with_tax();
                    }
                });
                const thisRuleChanges = {};
                thisRuleChanges.maxUnits = product.price ? Math.floor((amountToCheck - rule.minimum_amount) / product.price) : Infinity;
                thisRuleChanges.maxUnits = Math.min(available - rule.minimum_qty, thisRuleChanges.maxUnits);
                if (rule.reward_point_mode === 'unit') {
                    thisRuleChanges.pointsPerUnit = rule.reward_point_amount;
                    thisRuleChanges.pointsAdded = rule.reward_point_amount * totalProductQty;
                } else if (rule.reward_point_mode === 'money') {
                    thisRuleChanges.pointsPerUnit = rule.reward_point_amount * productPriceWithTax;
                    thisRuleChanges.pointsAdded = round_precision(rule.reward_point_amount * orderedProductPaid, 0.01);
                } else if (rule.reward_point_mode === 'order') {
                    thisRuleChanges.pointsPerUnit = 0;
                    thisRuleChanges.pointsAdded = rule.reward_point_amount;
                }
                ruleData.push(thisRuleChanges);
            }
            // We actually have to try out all possible amounts
            const maximumQty = Math.min(available, Math.floor(points / reward.required_points) * reward.reward_product_qty);
            let totalLostPerUnit = ruleData.reduce((sum, data) => sum + data.pointsPerUnit, 0);
            let lostPoints = 0;
            let units;
            for (units = 1; units <= maximumQty; units++) {
                let localLostPoints = lostPoints + totalLostPerUnit;
                for (const data of ruleData) {
                    if (units === (data.maxUnits + 1)) {
                        localLostPoints -= data.pointsPerUnit * units;
                        totalLostPerUnit -= data.pointsPerUnit;
                        localLostPoints += data.pointsAdded;
                    }
                }
                const consumedPoints = Math.ceil(units / reward.reward_product_qty) * reward.required_points;
                if (points - consumedPoints - localLostPoints < 0) {
                    units -= 1;
                    break;
                }
                lostPoints = localLostPoints;
            }
            if (pointChangeEntry) {
                pointChangeEntry.points -= lostPoints;
            }
            available = Math.max(0, units - freeClaimed);
        }
        return available;
    }
    _getRewardLineValuesProduct(args) {
        const reward = args['reward'];
        const product = this.pos.db.get_product_by_id(args['product'] || reward.reward_product_ids[0]);
        const availableQty = this._computeAvailableFreeProduct(reward, args['coupon_id'], product);
        if (availableQty <= 0) {
            return _t("There are not enough products in the basket to claim this reward.");
        }
        const points = this._getRealCouponPoints(args['coupon_id']);
        const claimable_count = reward.clear_wallet ? 1 : Math.min(Math.ceil(availableQty / reward.reward_product_qty), Math.floor(points / reward.required_points));
        const cost = reward.clear_wallet ? points : claimable_count * reward.required_points;
        return [{
            product: reward.discount_line_product_id,
            price: -product.lst_price,
            tax_ids: product.taxes_id,
            // In case the reward is the product multiple times, give it as many times as possible
            quantity: Math.min(availableQty, reward.reward_product_qty * claimable_count),
            reward_id: reward.id,
            is_reward_line: true,
            reward_product_id: product.id,
            coupon_id: args['coupon_id'],
            points_cost: cost,
            reward_identifier_code: _newRandomRewardCode(),
            merge: false,
        }]
    }
    async _activateCode(code) {
        const rule = this.pos.rules.find((rule) => {
            return rule.mode === 'with_code' && (rule.promo_barcode === code || rule.code === code)
        });
        let claimableRewards = null;
        if (rule) {
            if (this.codeActivatedProgramRules.includes(rule.id)) {
                return _t('That promo code program has already been activated.');
            }
            this.codeActivatedProgramRules.push(rule.id);
            await this._updateLoyaltyPrograms();
            claimableRewards = this.getClaimableRewards(false, rule.program_id.id);
        } else {
            if (this.codeActivatedCoupons.find((coupon) => coupon.code === code)) {
                return _t('That coupon code has already been scanned and activated.');
            }
            const customer = this.get_client();
            const { successful, payload } = await this.pos.env.services.rpc({
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
                const coupon = new PosLoyaltyCard(code, payload.coupon_id, payload.program_id, payload.partner_id, payload.points);
                this.pos.couponCache[coupon.id] = coupon;
                this.codeActivatedCoupons.push(coupon);
                await this._updateLoyaltyPrograms();
                claimableRewards = this.getClaimableRewards(coupon.id);
            } else {
                return payload.error_message;
            }
        }
        if (claimableRewards && claimableRewards.length === 1) {
            if (claimableRewards[0].reward.reward_type !== 'product' || !claimableRewards[0].reward.multi_product) {
                this._applyReward(claimableRewards[0].reward, claimableRewards[0].coupon_id);
                this._updateRewards();
            }
        }
        return true;
    }
    async activateCode(code) {
        const res = await this._activateCode(code);
        if (res !== true) {
            Gui.showNotification(res);
        }
    }
}
Registries.Model.extend(Order, PosLoyaltyOrder);
