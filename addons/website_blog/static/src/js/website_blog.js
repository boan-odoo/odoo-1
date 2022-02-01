odoo.define('website_blog.website_blog', function (require) {
'use strict';
var core = require('web.core');

const dom = require('web.dom');
const publicWidget = require('web.public.widget');

publicWidget.registry.websiteBlog = publicWidget.Widget.extend({
    selector: '.website_blog',
    events: {
        'click #o_wblog_next_container': '_onNextBlogClick',
        'click #o_wblog_post_content_jump': '_onContentAnchorClick',
        'click .o_twitter, .o_facebook, .o_linkedin, .o_google, .o_twitter_complete, .o_facebook_complete, .o_linkedin_complete, .o_google_complete': '_onShareArticle',
    },

    /**
     * @override
     */
    start: function () {
        $('.js_tweet, .js_comment').share({});
        const content = this.el.querySelector('.o_wblog_post_content_field');
        this.el.querySelectorAll('.o_container_as_first').forEach(container => {
            publicWidget.registry.websiteBlog.adjustWidth(content, container);
            container.classList.remove('o_container_as_first');
        });
        return this._super.apply(this, arguments);
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     * @param {Event} ev
     */
    _onNextBlogClick: function (ev) {
        ev.preventDefault();
        var self = this;
        var $el = $(ev.currentTarget);
        var nexInfo = $el.find('#o_wblog_next_post_info').data();
        $el.find('.o_record_cover_container').addClass(nexInfo.size + ' ' + nexInfo.text).end()
           .find('.o_wblog_toggle').toggleClass('d-none');
        // Appending a placeholder so that the cover can scroll to the top of the
        // screen, regardless of its height.
        const placeholder = document.createElement('div');
        placeholder.style.minHeight = '100vh';
        this.$('#o_wblog_next_container').append(placeholder);

        // Use _.defer to calculate the 'offset()'' only after that size classes
        // have been applyed and that $el has been resized.
        _.defer(function () {
            self._forumScrollAction($el, 300, function () {
                window.location.href = nexInfo.url;
            });
        });
    },
    /**
     * @private
     * @param {Event} ev
     */
    _onContentAnchorClick: function (ev) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        var $el = $(ev.currentTarget.hash);

        this._forumScrollAction($el, 500, function () {
            window.location.hash = 'blog_content';
        });
    },
    /**
     * @private
     * @param {Event} ev
     */
    _onShareArticle: function (ev) {
        ev.preventDefault();
        var url = '';
        var $element = $(ev.currentTarget);
        var blogPostTitle = encodeURIComponent($('#o_wblog_post_name').html() || '');
        var articleURL = encodeURIComponent(window.location.href);
        if ($element.hasClass('o_twitter')) {
            var twitterText = core._t("Amazing blog article: %s! Check it live: %s");
            var tweetText = _.string.sprintf(twitterText, blogPostTitle, articleURL);
            url = 'https://twitter.com/intent/tweet?tw_p=tweetbutton&text=' + tweetText;
        } else if ($element.hasClass('o_facebook')) {
            url = 'https://www.facebook.com/sharer/sharer.php?u=' + articleURL;
        } else if ($element.hasClass('o_linkedin')) {
            url = 'https://www.linkedin.com/sharing/share-offsite/?url=' + articleURL;
        }
        window.open(url, '', 'menubar=no, width=500, height=400');
    },

    //--------------------------------------------------------------------------
    // Utils
    //--------------------------------------------------------------------------

    /**
     * @private
     * @param {JQuery} $el - the element we are scrolling to
     * @param {Integer} duration - scroll animation duration
     * @param {Function} callback - to be executed after the scroll is performed
     */
    _forumScrollAction: function ($el, duration, callback) {
        dom.scrollTo($el[0], {duration: duration}).then(() => callback());
    },
});

/**
 * Adjusts the containers'width class based on the first (text) section of the
 * blog post content.
 * If there is a text section it uses the first text section, otherwise it
 * uses the first section.
 *
 * @static
 * @param {Element} blogPostContentEl blog post content element
 * @param {Element} containerEl container element to adjust
 */
publicWidget.registry.websiteBlog.adjustWidth = function (blogPostContentEl, containerEl) {
    let targetClass = 'o_container_small';
    let source;
    for (const extraSelector of ['.s_text_block ', ':first-of-type', ':first-of-type ']) {
        source = blogPostContentEl.querySelector([
            `section${extraSelector}.o_container_small`,
            `section${extraSelector}.container`,
            `section${extraSelector}.container-fluid`,
        ]);
        if (source) {
            if (source.classList.contains('container')) {
                targetClass = 'container';
            } else if (source.classList.contains('container-fluid')) {
                targetClass = 'container-fluid';
            }
            break;
        }
    }
    const widthClasses = ['container', 'container-fluid', 'o_container_small'];
    containerEl.classList.remove(...widthClasses.filter(c => c !== targetClass));
    containerEl.classList.add(targetClass);
};

});
