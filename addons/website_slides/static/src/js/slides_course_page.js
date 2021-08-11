/** @odoo-module **/

import publicWidget from 'web.public.widget';
import session from 'web.session';
import { qweb as QWeb } from 'web.core';


/**
 * Global widget for both fullscreen view and non-fullscreen view of a slide course.
 * Contains general methods to update the UI elements (progress bar, sidebar...) as well
 * as method to mark the slide as completed / uncompleted.
 */
export const SlideCoursePage = publicWidget.Widget.extend({
    events: {
        'click button.o_wslides_button_complete': '_onClickComplete',
    },

    custom_events: {
        'slide_completed': '_onSlideCompleted',
        'slide_to_complete': '_onSlideToComplete',
    },

    xmlDependencies: ['/website_slides/static/src/xml/website_slides_sidebar.xml'],

    /**
     * Greens up the bullet when the slide is completed
     *
     * @public
     * @param {Integer} slideId
     * @param {Boolean} completed
     */
    setSlideCompleted: function (slide, completed = true) {
        const $button = this.$(`.o_wslides_sidebar_done_button[data-id=${slide.id}]`);

        const newButton = QWeb.render('website.slides.sidebar.done.button', {
            slideId: slide.id,
            slideCompleted: completed,
            canBeUndone: slide.canBeUndone,
            canBeSkipped: slide.canBeSkipped,
        });

        if ($button.length) {
            $button.replaceWith(newButton);
            const $elem = this.$(`.o_wslides_sidebar_done_button[data-id="${slide.id}"]`);
            $elem.data('completed', completed);
        }
    },

    /**
     * Updates the progressbar whenever a lesson is completed
     *
     * @public
     * @param {*} channelCompletion
     */
    updateProgressbar: function (channelCompletion) {
        const completion = Math.min(100, channelCompletion);

        const $completed = $('.o_wslides_channel_completion_completed');
        const $progressbar = $('.o_wslides_channel_completion_progressbar');

        if (completion < 100) {
            // Hide the "Completed" text and show the progress bar
            $completed.addClass('d-none');
            $progressbar.removeClass('d-none').addClass('d-flex');
        } else {
            // Hide the progress bar and show the "Completed" text
            $completed.removeClass('d-none');
            $progressbar.addClass('d-none').removeClass('d-flex');
        }

        $progressbar.find('.progress-bar').css('width', `${completion}%`);
        $progressbar.find('.o_wslides_progress_percentage').text(completion);
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Once the completion conditions are filled,
     * rpc call to set the relation between the slide and the user as "completed"
     *
     * @private
     * @param {Integer} slideId: the id of slide to set as completed
     * @param {Boolean} completed: true to mark the slide as completed
     *     false to mark the slide as not completed
     */
    _setCompleted: async function (slide, completed = true) {
        if (!!slide.completed === !!completed) {
            // no useless RPC call
            return;
        }

        const data = await this._rpc({
            route: `/slides/slide/${completed ? 'set_completed' : 'set_uncompleted'}`,
            params: {slide_id: slide.id},
        });

        this.setSlideCompleted(slide, completed);
        this.updateProgressbar(data.channel_completion);

        slide.completed = true;
    },

    _getSlide: function (slideId) {
        return $(`.o_wslides_sidebar_done_button[data-id="${slideId}"]`).data();
    },

    //--------------------------------------------------------------------------
    // Handler
    //--------------------------------------------------------------------------
    _onClickComplete: function (ev) {
        ev.stopPropagation();
        ev.preventDefault();

        const $button = $(ev.currentTarget).parents('.o_wslides_sidebar_done_button');

        const slideData = $button.data();
        const isCompleted = Boolean(slideData.completed);

        this._setCompleted(slideData, !isCompleted);
    },

    /**
     * The slide has been completed, update the UI
     */
    _onSlideCompleted: function (ev) {
        const slideId = ev.data.slideId;
        const completed = ev.data.completed;
        const slide = this._getSlide(slideId);
        if (slide) {
            // Just joined the course (e.g. When "Submit & Join" action), update the UI
            this.setSlideCompleted(slide, completed);
        }
        this.updateProgressbar(ev.data.channelCompletion);
    },

    /**
     * Make a RPC call to complete the slide then update the UI
     */
    _onSlideToComplete: function (ev) {
        if (!session.is_website_user) { // no useless RPC call
            const slide = this._getSlide(ev.data.id);
            this._setCompleted(slide, true);
        }
    }
});
