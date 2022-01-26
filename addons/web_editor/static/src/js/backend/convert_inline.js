/** @odoo-module alias=web_editor.convertInline */
'use strict';

import FieldHtml from 'web_editor.field.html';
import { isBlock, rgbToHex } from '../../../lib/odoo-editor/src/utils/utils';

//--------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------

const RE_COL_MATCH = /(^| )col(-[\w\d]+)*( |$)/;
const RE_OFFSET_MATCH = /(^| )offset(-[\w\d]+)*( |$)/;
const RE_PADDING = /([\d.]+)/;
const RE_WHITESPACE = /[\s\u200b]*/;
const SELECTORS_IGNORE = /(^\*$|:hover|:before|:after|:active|:link|::|'|\([^(),]+[,(])/;
// Attributes all tables should have in a mailing.
const TABLE_ATTRIBUTES = {
    cellspacing: 0,
    cellpadding: 0,
    border: 0,
    width: '100%',
    align: 'center',
    role: 'presentation',
};
// Cancel tables default styles.
const TABLE_STYLES = {
    'border-collapse': 'collapse',
    'text-align': 'inherit',
    'font-size': 'unset',
    'line-height': 'unset',
};

//--------------------------------------------------------------------------
// Tools
//--------------------------------------------------------------------------

async function waitNextMacroTask () {
    return new Promise( resolve => setTimeout(resolve, 0));
}

//--------------------------------------------------------------------------
// Public
//--------------------------------------------------------------------------

/**
 * Convert snippets and mailing bodies to tables.
 *
 * @param {JQuery} $editable
 */
function addTables($editable) {
    for (const snippet of $editable.find('.o_mail_snippet_general, .o_layout')) {
        // Convert all snippets and the mailing itself into table > tr > td
        const table = _createTable(snippet.attributes);

        const row = document.createElement('tr');
        const col = document.createElement('td');
        row.appendChild(col);
        table.appendChild(row);

        for (const child of [...snippet.childNodes]) {
            col.appendChild(child);
        }
        snippet.before(table);
        snippet.remove();

        // If snippet doesn't have a table as child, wrap its contents in one.
        const childTable = [...col.children].find((child)=>child.querySelector('table'));
        if (!childTable) {
            const tableB = _createTable();
            const rowB = document.createElement('tr');
            const colB = document.createElement('td');

            rowB.appendChild(colB);
            tableB.appendChild(rowB);
            for (const child of [...col.childNodes]) {
                colB.appendChild(child);
            }
            col.appendChild(tableB);
        }
    }
}
/**
 * Convert CSS display for attachment link to real image.
 * Without this post process, the display depends on the CSS and the picture
 * does not appear when we use the html without css (to send by email for e.g.)
 *
 * @param {jQuery} $editable
 */
function attachmentThumbnailToLinkImg($editable) {
    $editable.find('a[href*="/web/content/"][data-mimetype]').filter(':empty, :containsExact( )').each(function () {
        var $link = $(this);
        var $img = $(document.createElement('img'))
            .attr('src', $link.css('background-image').replace(/(^url\(['"])|(['"]\)$)/g, ''))
            .css('height', Math.max(1, $link.height()) + 'px')
            .css('width', Math.max(1, $link.width()) + 'px');
        $link.prepend($img);
    });
}
/**
 * Convert Bootstrap rows and columns to actual tables.
 *
 * Note: Because of the limited support of media queries in emails, this doesn't
 * support the mixing and matching of column options (e.g., "col-4 col-sm-6" and
 * "col col-4" aren't supported).
 *
 * @param {jQuery} $editable
 */
function bootstrapToTable($editable) {
    // First give all rows in columns a separate container parent.
    $editable.find('.row').filter((i, row) => RE_COL_MATCH.test(row.parentElement.className)).wrap('<div class="o_fake_table"/>');

    // These containers from the mass mailing masonry snippet require full
    // height contents, which is only possible if the table itself has a set
    // height. We also need to restyle it because of the change in structure.
    $editable.find('.o_masonry_grid_container').css('padding', 0)
    .find('> .o_fake_table').css('height', function() { return $(this).height() });
    for (const masonryRow of $editable.find('.o_masonry_grid_container > .o_fake_table > .row.h-100')) {
        masonryRow.style.removeProperty('height');
        masonryRow.parentElement.style.setProperty('height', '100%');
    }

    // Now convert all containers with rows to tables.
    for (const container of $editable.find('.container:has(.row), .container-fluid:has(.row), .o_fake_table:has(.row)')) {
        const $container = $(container);


        // TABLE
        const $table = $(_createTable(container.attributes));
        for (const child of [...container.childNodes]) {
            $table.append(child);
        }
        $table.removeClass('container container-fluid o_fake_table');
        if (!$table[0].className) {
            $table.removeAttr('class');
        }
        $container.before($table);
        $container.remove();


        // ROWS
        // First give all siblings of rows a separate row/col parent combo.
        $table.children().filter((i, child) => isBlock(child) && !$(child).hasClass('row')).wrap('<div class="row"><div class="col-12"/></div>');

        const $bootstrapRows = $table.children().filter('.row');
        for (const bootstrapRow of $bootstrapRows) {
            const $bootstrapRow = $(bootstrapRow);
            const $row = $(document.createElement('tr'));
            for (const attr of bootstrapRow.attributes) {
                $row.attr(attr.name, attr.value);
            }
            $row.removeClass('row');
            if (!$row[0].className) {
                $row.removeAttr('class');
            }
            for (const child of [...bootstrapRow.childNodes]) {
                $row.append(child);
            }
            $bootstrapRow.before($row);
            $bootstrapRow.remove();


            // COLUMNS
            const $bootstrapColumns = $row.children().filter((i, column) => column.className && column.className.match(RE_COL_MATCH));

            // 1. Replace generic "col" classes with specific "col-n", computed
            //    by sharing the available space between them.
            const $flexColumns = $bootstrapColumns.filter((i, column) => !/\d/.test(column.className.match(RE_COL_MATCH)[0] || '0'));
            const colTotalSize = $bootstrapColumns.toArray().map(child => _getColumnSize(child)).reduce((a, b) => a + b);
            const colSize = Math.max(1, Math.round((12 - colTotalSize) / $flexColumns.length));
            for (const flexColumn of $flexColumns) {
                flexColumn.classList.remove(flexColumn.className.match(RE_COL_MATCH)[0].trim());
                flexColumn.classList.add(`col-${colSize}`);
            }

            // 2. Create and fill up the row(s) with grid(s).
            let grid = _createColumnGrid();
            let gridIndex = 0;
            let $currentRow = $($row[0].cloneNode());
            $row.after($currentRow);
            let $currentCol;
            let columnIndex = 0;
            for (const bootstrapColumn of $bootstrapColumns) {
                const columnSize = _getColumnSize(bootstrapColumn);
                if (gridIndex + columnSize < 12) {
                    $currentCol = grid[gridIndex];
                    _applyColspan($currentCol, columnSize);
                    if (columnIndex === $bootstrapColumns.length - 1) {
                        // We handled all the columns but there is still space
                        // in the row. Insert the columns and fill the row.
                        grid[gridIndex].attr('colspan', 12 - gridIndex);
                        $currentRow.append(...grid.filter(td => td.attr('colspan')));
                    }
                    gridIndex += columnSize;
                } else if (gridIndex + columnSize === 12) {
                    // Finish the row.
                    $currentCol = grid[gridIndex];
                    _applyColspan($currentCol, columnSize);
                    $currentRow.append(...grid.filter(td => td.attr('colspan')));
                    if (columnIndex !== $bootstrapColumns.length - 1) {
                        // The row was filled before we handled all of its
                        // columns. Create a new one and start again from there.
                        const $previousRow = $currentRow;
                        $currentRow = $($currentRow[0].cloneNode());
                        $previousRow.after($currentRow);
                        grid = _createColumnGrid();
                        gridIndex = 0;
                    }
                } else {
                    // Fill the row with what was in the grid before it
                    // overflowed.
                    _applyColspan(grid[gridIndex], 12 - gridIndex);
                    $currentRow.append(...grid.filter(td => td.attr('colspan')));
                    // Start a new row that starts with the current col.
                    const $previousRow = $currentRow;
                    $currentRow = $($currentRow[0].cloneNode());
                    $previousRow.after($currentRow);
                    grid = _createColumnGrid();
                    $currentCol = grid[0];
                    _applyColspan($currentCol, columnSize);
                    gridIndex = columnSize;
                    if (columnIndex === $bootstrapColumns.length - 1 && gridIndex < 12) {
                        // We handled all the columns but there is still space
                        // in the row. Insert the columns and fill the row.
                        grid[gridIndex].attr('colspan', 12 - gridIndex);
                        $currentRow.append(...grid.filter(td => td.attr('colspan')));
                        // Adapt width to colspan.
                        _applyColspan(grid[gridIndex], 12 - gridIndex);
                    }
                }
                if ($currentCol) {
                    for (const attr of bootstrapColumn.attributes) {
                        if (attr.name !== 'colspan') {
                            $currentCol.attr(attr.name, attr.value);
                        }
                    }
                    const colMatch = bootstrapColumn.className.match(RE_COL_MATCH);
                    $currentCol.removeClass(colMatch[0]);
                    if (!$currentCol[0].className) {
                        $currentCol.removeAttr('class');
                    }
                    for (const child of [...bootstrapColumn.childNodes]) {
                        $currentCol.append(child);
                    }
                    // Adapt width to colspan.
                    _applyColspan($currentCol, +$currentCol.attr('colspan'));
                }
                columnIndex++;
            }
            $row.remove(); // $row was cloned and inserted already
        }
    }
}
/**
 * Convert Bootstrap cards to table structures.
 *
 * @param {JQuery} $editable
 */
function cardToTable($editable) {
    for (const card of $editable.find('.card')) {
        const $card = $(card);
        const $table = $(_createTable(card.attributes));
        for (const child of [...card.childNodes]) {
            const $row = $(document.createElement('tr'));
            const $col = $(document.createElement('td'));
            if (child.nodeName === 'IMG') {
                $col.append(child);
            } else if (child.nodeType === Node.TEXT_NODE) {
                if (child.textContent.replace(RE_WHITESPACE, '').length) {
                    $col.append(child);
                } else {
                    continue;
                }
            } else {
                for (const attr of child.attributes) {
                    $col.attr(attr.name, attr.value);
                }
                for (const descendant of [...child.childNodes]) {
                    $col.append(descendant);
                }
                $(child).remove();
            }
            const $subTable = $(_createTable());
            const $superRow = $(document.createElement('tr'));
            const $superCol = $(document.createElement('td'));
            $row.append($col);
            $subTable.append($row);
            $superCol.append($subTable);
            $superRow.append($superCol);
            $table.append($superRow);
        }
        $card.before($table);
        $card.remove();
    }
}
/**
 * Convert CSS style to inline style (leave the classes on elements but forces
 * the style they give as inline style).
 *
 * @param {jQuery} $editable
 * @param {Object} cssRules
 */
function classToStyle($editable, cssRules) {
    const writes = [];
    const nodeToRules = new Map();

    for (const rule of cssRules) {
        const nodes = $editable[0].querySelectorAll(rule.selector);
        for (const node of nodes) {
            const nodeRules = nodeToRules.get(node);
            if (!nodeRules) {
                nodeToRules.set(node, [rule]);
            } else {
                nodeRules.push(rule);
            }
        }
    }

    _applyOverDescendants($editable[0], function (node) {
        const $target = $(node);
        const nodeRules = nodeToRules.get(node);
        const css = nodeRules ? _getMatchedCSSRules(node, nodeRules) : {};
        // Flexbox
        for (const styleName of node.style) {
            if (styleName.includes('flex') || `${node.style[styleName]}`.includes('flex')) {
                writes.push(()=> { node.style[styleName] = ''; });
            }
        }
        // Ignore font-family (mail-safe font declared in <head>)
        if ('font-family' in css) {
            delete css['font-family'];
        }

        // Do not apply css that would override inline styles (which are prioritary).
        let style = $target.attr('style') || '';
        // Outlook doesn't support inline !important
        style = style.replace(/!important/g,'');
        for (const [key, value] of Object.entries(css)) {
            if (!(new RegExp(`(^|;)\\s*${key}`).test(style))) {
                style = `${key}:${value};${style}`;
            }
        };
        if (_.isEmpty(style)) {
            writes.push(()=> { $target.removeAttr('style'); });
        } else {
            writes.push(()=> { $target.attr('style', style); });
        }
        if ($target.get(0).style.width) {
            const width = $target.css('width');
            writes.push(()=> { $target.attr('width', width); });
        }

        // Media list images should not have an inline height
        if (node.nodeName === 'IMG' && $target.hasClass('s_media_list_img')) {
            writes.push(()=> { $target.css('height', ''); });
        }
        // Apple Mail
        if (node.nodeName === 'TD' && !node.childNodes.length) {
            writes.push(()=> { $(node).append('&nbsp;'); });
        }
        // Outlook
        if (node.nodeName === 'A' && $target.hasClass('btn') && !$target.hasClass('btn-link') && !$target.children().length) {
            writes.push(()=> { $target.prepend(`<!--[if mso]><i style="letter-spacing: 25px; mso-font-width: -100%; mso-text-raise: 30pt;">&nbsp;</i><![endif]-->`); });
            writes.push(()=> { $target.append(`<!--[if mso]><i style="letter-spacing: 25px; mso-font-width: -100%;">&nbsp;</i><![endif]-->`); });
        } else if (node.nodeName === 'IMG' && $target.is('.mx-auto.d-block')) {
            writes.push(()=> { $target.wrap('<p class="o_outlook_hack" style="text-align:center;margin:0"/>'); });
        }
    });
    writes.forEach(fn => fn());
}
/**
 * Convert the contents of an editable area (as a JQuery element) into content
 * that is widely compatible with email clients. If no CSS Rules are given, they
 * will be computed for the editable element's owner document.
 *
 * @param {JQuery} $editable
 * @param {Object[]} cssRules Array<{selector: string;
 *                                   style: {[styleName]: string};
 *                                   specificity: number;}>
 * @param {JQuery} [$iframe] the iframe containing the editable, if any
 */
function toInline($editable, cssRules, $iframe) {
    console.profile('toInline');
    // If the editable is not visible, we need to make it visible in order to
    // retrieve image/icon dimensions. This iterates over ancestors to make them
    // visible again. We then restore it at the end of this function.
    const displaysToRestore = [];
    if (!$editable.is(':visible')) {
        let $ancestor = $editable;
        while ($ancestor[0] && !$ancestor.is('html') && !$ancestor.is(':visible')) {
            if ($ancestor.css('display') === 'none') {
                displaysToRestore.push([$ancestor, $ancestor[0].style.display]);
                $ancestor.css('display', 'block');
            }
            $ancestor = $ancestor.parent();
            if ((!$ancestor[0] || $ancestor.is('html')) && $iframe && $iframe[0]) {
                $ancestor = $iframe;
            }
        }
    }

    // Fix outlook image rendering bug (this change will be kept in both
    // fields).
    _.each(['width', 'height'], function (attribute) {
        $editable.find('img').attr(attribute, function () {
            return ($(this).attr(attribute)) || (attribute === 'height' && this.offsetHeight) || $(this)[attribute]();
        }).css(attribute, function () {
            return $(this).attr(attribute);
        });
    });

    attachmentThumbnailToLinkImg($editable);
    fontToImg($editable);
    classToStyle($editable, cssRules);
    bootstrapToTable($editable);
    cardToTable($editable);
    listGroupToTable($editable);
    addTables($editable);
    formatTables($editable);
    normalizeColors($editable);
    normalizeRem($editable);

    for (const displayToRestore of displaysToRestore) {
        $(displayToRestore[0]).css('display', displayToRestore[1]);
    }
    console.profileEnd('toInline')
}
/**
 * Convert font icons to images.
 *
 * @param {jQuery} $editable - the element in which the font icons have to be
 *                           converted to images
 */
function fontToImg1($editable) {
    console.profile('fontToImg1');
    const fonts = odoo.__DEBUG__.services["wysiwyg.fonts"];

    $editable.find('.fa').each(function () {
        const $font = $(this);
        let icon, content;
        _.find(fonts.fontIcons, function (font) {
            return _.find(fonts.getCssSelectors(font.parser), function (data) {
                if ($font.is(data.selector.replace(/::?before/g, ''))) {
                    icon = data.names[0].split('-').shift();
                    content = data.css.match(/content:\s*['"]?(.)['"]?/)[1];
                    return true;
                }
            });
        });
        if (content) {
            const color = $font.css('color').replace(/\s/g, '');
            let $backgroundColoredElement = $font;
            let bg, isTransparent;
            do {
                bg = $backgroundColoredElement.css('background-color').replace(/\s/g, '');
                isTransparent = bg === 'transparent' || bg === 'rgba(0,0,0,0)';
                $backgroundColoredElement = $backgroundColoredElement.parent();
            } while (isTransparent && $backgroundColoredElement[0]);
            if (bg === 'rgba(0,0,0,0)' && isTransparent) {
                // default on white rather than black background since opacity
                // is not supported.
                bg = 'rgb(255,255,255)';
            }
            const style = $font.attr('style');
            const width = $font.width();
            const height = $font.height();
            const lineHeight = $font.css('line-height');
            // Compute the padding.
            // First get the dimensions of the icon itself (::before)
            $font.css({height: 'fit-content', width: 'fit-content', 'line-height': 'normal'});
            const intrinsicWidth = $font.width();
            const intrinsicHeight = $font.height();
            const hPadding = width && (width - intrinsicWidth) / 2;
            const vPadding = height && (height - intrinsicHeight) / 2;
            let padding = '';
            if (hPadding || vPadding) {
                padding = vPadding ? vPadding + 'px ' : '0 ';
                padding += hPadding ? hPadding + 'px' : '0';
            }
            const $img = $('<img/>').attr({
                width, height,
                src: `/web_editor/font_to_img/${content.charCodeAt(0)}/${window.encodeURI(color)}/${window.encodeURI(bg)}/${Math.max(1, Math.round(intrinsicWidth))}x${Math.max(1, Math.round(intrinsicHeight))}`,
                'data-class': $font.attr('class'),
                'data-style': style,
                style,
            }).css({
                'box-sizing': 'border-box', // keep the fontawesome's dimensions
                'line-height': lineHeight,
                width: intrinsicWidth, height: intrinsicHeight,
            });
            if (!padding) {
                $img.css('margin', $font.css('margin'));
            }
            // For rounded images, apply the rounded border to a wrapper, make
            // sure it doesn't get applied to the image itself so the image
            // doesn't get cropped in the process.
            const $wrapper = $('<span style="display: inline-block;"/>');
            $wrapper.append($img);
            $font.replaceWith($wrapper);
            $wrapper.css({
                padding, width: width + 'px', height: height + 'px',
                'vertical-align': 'middle',
                'background-color': $img[0].style.backgroundColor,
            }).attr('class', $font.attr('class').replace(new RegExp('(^|\\s+)' + icon + '(-[^\\s]+)?', 'gi'), '')) // remove inline font-awsome style);
        } else {
            $font.remove();
        }
    });
    console.profileEnd('fontToImg1');
}
function fontToImg($editable) {
    const fonts = odoo.__DEBUG__.services["wysiwyg.fonts"];
    console.profile('fontToImg2');

        // _.find(fonts.fontIcons, function (font) {
    const fontSelectors = [];
    for (const font of fonts.fontIcons) {
        console.log("fonts.getCssSelectors(font.parser):", );
        fontSelectors.push(
            ...fonts.getCssSelectors(font.parser).map((x) => ({
                selector: x.selector.replace(/::?before/g, ''),
                content: x.css.match(/content:\s*['"]?(.)['"]?/)[1],
                names: x.names,
            }))
        );
    }
    const icons = $editable.find('.fa').toArray();
    const iconSet = new Set(icons);
    const map = new Map();
    for (const {selector, content, names} of fontSelectors) {
        for (const node of $editable[0].querySelectorAll(selector)) {
            iconSet.delete(node);
            map.set(node, {
                name: names[0].split('-').shift(),
                content,
            });
        }
        if (!iconSet.size) {
            break;
        }
    }

    const dimentionWrite = [];
    const dimentionRead = [];
    const finalWrite = [];
    for (const [faElement, infos] of map.entries()) {
        const iconName = infos.name;
        const content = infos.content;

        let faComputedStyle = getComputedStyle(faElement);
        const color = faComputedStyle.color.replace(/\s/g, '');
        let backgroundColoredElement = faElement;
        let bg, isTransparent;
        do {
            bg = getComputedStyle(backgroundColoredElement)['background-color'].replace(/\s/g, '');
            isTransparent = bg === 'transparent' || bg === 'rgba(0,0,0,0)';
            backgroundColoredElement = backgroundColoredElement.parentElement;
        } while (isTransparent && backgroundColoredElement);
        if (bg === 'rgba(0,0,0,0)' && isTransparent) {
            // default on white rather than black background since opacity
            // is not supported.
            bg = 'rgb(255,255,255)';
        }
        const style = faElement.getAttribute('style');
        const width = parseFloat(faComputedStyle.width, 10);
        const height = parseFloat(faComputedStyle.height, 10);
        const lineHeight = faComputedStyle['line-height'];
        // console.log("$font.css('line-height'):", $font.css('line-height'));
        // console.log("faComputedStyle.line-height:", faComputedStyle['line-height']);
        // Compute the padding.
        // First get the dimensions of the icon itself (::before)


        dimentionWrite.push(() => {
            faElement.style['height'] = 'fit-content';
            faElement.style['width'] = 'fit-content';
            faElement.style['line-height'] = 'normal';
        });

        dimentionRead.push(() => { faComputedStyle = getComputedStyle(faElement) });

        finalWrite.push(() => {
            const intrinsicWidth = parseFloat(faComputedStyle.width, 10);
            const intrinsicHeight = parseFloat(faComputedStyle.height, 10);
            const hPadding = width && (width - intrinsicWidth) / 2;
            const vPadding = height && (height - intrinsicHeight) / 2;
            let padding = '';
            if (hPadding || vPadding) {
                padding = vPadding ? vPadding + 'px ' : '0 ';
                padding += hPadding ? hPadding + 'px' : '0';
            }
            const img = document.createElement('img');
            img.setAttribute('width', width);
            img.setAttribute('height', height);
            img.setAttribute('src', `/web_editor/font_to_img/${content.charCodeAt(0)}/${window.encodeURI(color)}/${window.encodeURI(bg)}/${Math.max(1, Math.round(intrinsicWidth))}x${Math.max(1, Math.round(intrinsicHeight))}`);
            // img.setAttribute('data-class', faElement.getAttribute('class'));
            img.setAttribute( 'data-style', style);
            img.setAttribute('style', style);
            img.style['box-sizing'] = 'border-box'; // keep the fontawesome's dimensions
            img.style['line-height'] = lineHeight;
            img.style['width'] = intrinsicWidth;
            img.style['height'] = intrinsicHeight;

            if (!padding) {
                img.style['margin'] = faComputedStyle['margin'];
            }
            // For rounded images, apply the rounded border to a wrapper, make
            // sure it doesn't get applied to the image itself so the image
            // doesn't get cropped in the process.
            const wrapper = document.createElement('span');
            wrapper.style['display'] = 'inline-block';
            wrapper.appendChild(img);
            // $wrapper.append($img);

            faElement.replaceWith(wrapper);
            wrapper.style['padding'] = padding;
            wrapper.style['width'] = width + 'px';
            wrapper.style['height'] = height + 'px';
            wrapper.style['vertical-align'] = 'middle';
            // wrapper.style['background-color'] = img.style.backgroundColor;
            // wrapper.setAttribute('class', faElement.getAttribute('class').replace(new RegExp('(^|\\s+)' + iconName + '(-[^\\s]+)?', 'gi'), '')); // remove inline font-awsome style);
        });
    }
    dimentionWrite.forEach(fn => fn());
    dimentionRead.forEach(fn => fn());
    $editable.hide();
    finalWrite.forEach(fn => fn());
    $editable.show();


    for (const icon of iconSet) {
        icon.remove();
    }
    console.log("map:", map);


    // $editable.find('.fa').each(function () {
    //     // const $font = $(this);
    //     // let iconName, content;
    //     // _.find(fonts.fontIcons, function (font) {
    //     //     return _.find(fonts.getCssSelectors(font.parser), function (data) {
    //     //         if ($font.is(data.selector.replace(/::?before/g, ''))) {
    //     //             iconName = data.names[0].split('-').shift();
    //     //             content = data.css.match(/content:\s*['"]?(.)['"]?/)[1];
    //     //             return true;
    //     //         }
    //     //     });
    //     // });
    //     console.profileEnd('fa');
    // });
    console.profileEnd('fontToImg2');
}
/**
 * Format table styles so they display well in most mail clients. This implies
 * moving table paddings to its cells, adding tbody (with canceled styles) where
 * needed, and adding pixel heights to parents of elements with percent heights.
 *
 * @param {JQuery} $editable
 */
function formatTables($editable) {
    const writes = [];
    for (const table of $editable.find('table.o_mail_snippet_general, .o_mail_snippet_general table')) {
        const $table = $(table);
        const computedStyle = getComputedStyle(table);
        const tablePaddingTop = parseFloat(computedStyle.paddingTop.match(RE_PADDING)[1]);
        const tablePaddingRight = parseFloat(computedStyle.paddingRight.match(RE_PADDING)[1]);
        const tablePaddingBottom = parseFloat(computedStyle.paddingBottom.match(RE_PADDING)[1]);
        const tablePaddingLeft = parseFloat(computedStyle.paddingLeft.match(RE_PADDING)[1]);
        const $rows = $table.find('tr').filter((i, tr) => $(tr).closest('table').is($table));
        const $columns = $table.find('td').filter((i, td) => $(td).closest('table').is($table));
        for (const column of $columns) {
            const $column = $(column);
            const $columnsInRow = $column.closest('tr').find('td').filter((i, td) => $(td).closest('table').is($table));
            const columnIndex = $columnsInRow.toArray().findIndex(col => $(col).is($column));
            const rowIndex = $rows.toArray().findIndex(row => $(row).is($column.closest('tr')));
            const computedStyleColumn = getComputedStyle(column);

            if (!rowIndex) {
                const match = computedStyleColumn.paddingTop.match(RE_PADDING);
                const columnPaddingTop = match ? parseFloat(match[1]) : 0;
                writes.push(() => {column.style['padding-top'] = `${columnPaddingTop + tablePaddingTop}px`; });
            }
            if (columnIndex === $columnsInRow.length - 1) {
                const match = computedStyleColumn.paddingRight.match(RE_PADDING);
                const columnPaddingRight = match ? parseFloat(match[1]) : 0;
                writes.push(() => {column.style['padding-right'] = `${columnPaddingRight + tablePaddingRight}px`; });
            }
            if (rowIndex === $rows.length - 1) {
                const match = computedStyleColumn.paddingBottom.match(RE_PADDING);
                const columnPaddingBottom = match ? parseFloat(match[1]) : 0;
                writes.push(() => {column.style['padding-bottom'] = `${columnPaddingBottom + tablePaddingBottom}px`; });
            }
            if (!columnIndex) {
                const match = computedStyleColumn.paddingLeft.match(RE_PADDING);
                const columnPaddingLeft = match ? parseFloat(match[1]) : 0;
                writes.push(() => {column.style['padding-left'] = `${columnPaddingLeft + tablePaddingLeft}px`; });
            }
        }
        writes.push(() => { $table.css('padding', ''); });
    }
    writes.forEach((fn) => fn());
    // Ensure a tbody in every table and cancel its default style.
    for (const table of $editable.find('table:not(:has(tbody))')) {
        const $contents = $(table).contents();
        $(table).prepend('<tbody style="vertical-align: top;"/>');
        $(table.firstChild).append($contents);
    }
    // Children will only take 100% height if the parent has a height property.
    for (const node of $editable.find('*').filter((i, n) => (
        n.style && n.style.getPropertyValue('height') === '100%' && (
            !n.parentElement.style.getPropertyValue('height') ||
            n.parentElement.style.getPropertyValue('height').includes('%'))
    ))) {
        let parent = node.parentElement;
        let height = parent.style.getPropertyValue('height');
        while (parent && height && height.includes('%')) {
            parent = parent.parentElement;
            height = parent.style.getPropertyValue('height');
        }
        if (parent) {
            parent.style.setProperty('height', '0');
        }
    }
    // Align self and justify content don't work on table cells.
    for (const cell of $editable.find('td')) {
        const alignSelf = cell.style.alignSelf;
        const justifyContent = cell.style.justifyContent;
        if (alignSelf === 'start' || justifyContent === 'start' || justifyContent === 'flex-start') {
            cell.style.verticalAlign = 'top';
        } else if (alignSelf === 'center' || justifyContent === 'center') {
            cell.style.verticalAlign = 'middle';
        } else if (alignSelf === 'end' || justifyContent === 'end' || justifyContent === 'flex-end') {
            cell.style.verticalAlign = 'bottom';
        }
    }
    // Align items doesn't work on table rows.
    for (const cell of $editable.find('tr')) {
        const alignItems = cell.style.alignItems;
        if (alignItems === 'flex-start') {
            cell.style.verticalAlign = 'top';
        } else if (alignItems === 'center') {
            cell.style.verticalAlign = 'middle';
        } else if (alignItems === 'flex-end' || alignItems === 'baseline') {
            cell.style.verticalAlign = 'bottom';
        }
    }
}
/**
 * Parse through the given document's stylesheets, preprocess(*) them and return
 * the result as an array of objects, each containing a selector string , a
 * style object and a specificity number. Preprocessing involves grouping
 * whatever rules can be grouped together and precomputing their specificity so
 * as to sort them appropriately.
 *
 * @param {Document} doc
 * @returns {Object[]} Array<{selector: string;
 *                            style: {[styleName]: string};
 *                            specificity: number;}>
 */
async function getCSSRules(doc) {
    console.profile('getcssrules')
    // Wait next macro task to prevent the browser to freeze too much.
    await waitNextMacroTask();
    const cssRules = [];
    for (const sheet of doc.styleSheets) {
        // try...catch because browser may not able to enumerate rules for cross-domain sheets
        let rules;
        try {
            rules = sheet.rules || sheet.cssRules;
        } catch (e) {
            console.log("Can't read the css rules of: " + sheet.href, e);
            continue;
        }
        for (const rule of (rules || [])) {
            const subRules = [rule];
            const conditionText = rule.conditionText;
            const minWidthMatch = conditionText && conditionText.match(/\(min-width *: *(\d+)/);
            const minWidth = minWidthMatch && +(minWidthMatch[1] || '0');
            if (minWidth && minWidth >= 1200) {
                // Large min-width media queries should be included.
                // eg., .container has a default max-width for all screens.
                let mediaRules;
                try {
                    mediaRules = rule.rules || rule.cssRules;
                    subRules.push(...mediaRules);
                } catch (e) {
                    console.log(`Can't read the css rules of: ${sheet.href} (${conditionText})`, e);
                }
            }
            for (const subRule of subRules) {
                const selectorText = subRule.selectorText;
                if (selectorText && !SELECTORS_IGNORE.test(selectorText)) {
                    const style = _normalizeStyle(subRule.style);
                    if (Object.keys(style).length) {
                        for (let selector of selectorText.split(',')) {
                            selector = selector.trim();
                            cssRules.push({ selector, style, specificity: _computeSpecificity(selector) });
                        }
                    }
                }
            }
        }
        // Wait next macro task to prevent the browser to freeze too much.
        await waitNextMacroTask();
    }

    // Group together rules with the same selector.
    for (let i = cssRules.length - 1; i >= 0; i--) {
        for (let j = cssRules.length - 1; j >= 0; j--) {
            if (i > j && cssRules[i].selector === cssRules[j].selector) {
                // Styles of "later" selector override styles of "earlier" one.
                const importantJStyles = {};

                const previousStyle = cssRules[j].style;
                const previousStyleKey = Object.keys(previousStyle);
                const sameKeys = Object.keys(cssRules[i].style).filter(x => previousStyleKey.includes(x));

                for (const key of sameKeys) {
                    if (previousStyle[key].endsWith('!important')) {
                        importantJStyles[key] = previousStyle[key];
                    }
                    delete previousStyle[key];
                }

                for (const [key, value] of Object.entries(importantJStyles)) {
                    cssRules[i].style[key] = value;
                }

                if (!Object.keys(previousStyleKey).length) {
                    cssRules.splice(j, 1);
                    i--;
                }
            }
        }
    }
    // The top element of a mailing has the class 'o_layout'. Give it the body's
    // styles so they can trickle down.
    cssRules.unshift({
        selector: '.o_layout',
        style: {...cssRules.find(r => r.selector === 'body').style},
        specificity: 1,
    });

    cssRules.sort((a, b) => a.specificity - b.specificity);
    console.profileEnd('getcssrules')
    return cssRules;
}
/**
 * Convert Bootstrap list groups and their items to table structures.
 *
 * @param {JQuery} $editable
 */
function listGroupToTable($editable) {
    for (const listGroup of $editable.find('.list-group')) {
        const $listGroup = $(listGroup);
        let $table;
        if ($listGroup.find('.list-group-item').length) {
            $table = $(_createTable(listGroup.attributes));
        } else {
            $table = $(listGroup.cloneNode());
            for (const attr of $listGroup.attributes) {
                $table.attr(attr.name, attr.value);
            }
        }
        for (const child of [...listGroup.childNodes]) {
            const $child = $(child);
            if ($child.hasClass('list-group-item')) {
                // List groups are <ul>s that render like tables. Their
                // li.list-group-item children should translate to tr > td.
                const $row = $(document.createElement('tr'));
                const $col = $(document.createElement('td'));
                for (const attr of child.attributes) {
                    $col.attr(attr.name, attr.value);
                }
                for (const descendant of [...child.childNodes]) {
                    $col.append(descendant);
                }
                $col.removeClass('list-group-item');
                if (!$col[0].className) {
                    $col.removeAttr('class');
                }
                $row.append($col);
                $table.append($row);
                $(child).remove();
            } else if (child.nodeName === 'LI') {
                $table.append(...child.childNodes);
            } else {
                $table.append(child);
            }
        }
        $table.removeClass('list-group');
        if (!$table[0].className) {
            $table.removeAttr('class');
        }
        if ($listGroup.is('td')) {
            $listGroup.append($table);
            $listGroup.removeClass('list-group');
            if (!$listGroup[0].className) {
                $listGroup.removeAttr('class');
            }
        } else {
            $listGroup.before($table);
            $listGroup.remove();
        }
    }
}
/**
 * Convert all styles containing rgb colors to hexadecimal colors.
 * Note: ignores rgba colors, which are not supported in Microsoft Outlook.
 *
 * @param {JQuery} $editable
 */
function normalizeColors($editable) {
    for (const node of $editable.find('[style*="rgb"]')) {
        const rgbMatch = node.getAttribute('style').match(/rgb?\(([\d\.]*,?\s?){3,4}\)/g);
        for (const rgb of rgbMatch || []) {
            node.setAttribute('style', node.getAttribute('style').replace(rgb, rgbToHex(rgb)));
        }
    }
}
/**
 * Convert all css values that use the rem unit to px.
 *
 * @param {JQuery} $editable
 */
function normalizeRem($editable) {
    const rootFontSizeProperty = $editable.closest('html').css('font-size');
    const rootFontSize = parseFloat(rootFontSizeProperty.replace(/[^\d\.]/g, ''));
    for (const node of $editable.find('[style*="rem"]')) {
        const remMatch = node.getAttribute('style').match(/[\d\.]+\s*rem/g);
        for (const rem of remMatch || []) {
            const remValue = parseFloat(rem.replace(/[^\d\.]/g, ''));
            const pxValue = Math.round(remValue * rootFontSize * 100) / 100;
            node.setAttribute('style', node.getAttribute('style').replace(rem, pxValue + 'px'));
        }
    }
}

//--------------------------------------------------------------------------
// Private
//--------------------------------------------------------------------------

/**
 * Take a JQuery element and apply a colspan to it. In this context, this
 * implies to also apply a width to it, that corresponds to the colspan.
 *
 * @param {JQuery} $element
 * @param {number} colspan
 */
function _applyColspan($element, colspan) {
    $element.attr('colspan', colspan);
    // Round to 2 decimal places.
    const width = (Math.round(+$element.attr('colspan') * 10000 / 12) / 100) + '%';
    $element.attr('width', width);
    $element.css('width', width);
}
/*
 * Utility function to apply function over descendants elements
 *
 * This is needed until the following issue of jQuery is solved:
 *  https://github.com./jquery/sizzle/issues/403
 *
 * @param {Element} node The root Element node
 * @param {Function} func The function applied over descendants
 */
function _applyOverDescendants(node, func) {
    node = node.firstChild;
    while (node) {
        if (node.nodeType === 1) {
            func(node);
            _applyOverDescendants(node, func);
        }
        var $node = $(node);
        if (node.nodeName === 'A' && $node.hasClass('btn') && !$node.children().length && $(node).parents('.o_outlook_hack').length)  {
            node = $(node).parents('.o_outlook_hack')[0];
        }
        else if (node.nodeName === 'IMG' && $node.parent('p').hasClass('o_outlook_hack')) {
            node = $node.parent()[0];
        }
        node = node.nextSibling;
    }
}
/**
 * Take a selector and return its specificity according to the w3 specification.
 *
 * @see http://www.w3.org/TR/css3-selectors/#specificity
 * @param {string} selector
 * @returns number
 */
function _computeSpecificity(selector) {
    let a = 0;
    selector = selector.replace(/#[a-z0-9_-]+/gi, () => { a++; return ''; });
    let b = 0;
    selector = selector.replace(/(\.[a-z0-9_-]+)|(\[.*?\])/gi, () => { b++; return ''; });
    let c = 0;
    selector = selector.replace(/(^|\s+|:+)[a-z0-9_-]+/gi, a => { if (!a.includes(':not(')) c++; return ''; });
    return (a * 100) + (b * 10) + c;
}
/**
 * Return an array of twelve table cells as JQuery elements.
 *
 * @returns {JQuery[]}
 */
function _createColumnGrid() {
    return new Array(12).fill().map(() => $(document.createElement('td')));
}
/**
 * Return a table as a JQuery element, with its default styles and attributes,
 * as well as the applicable given attributes, if any.
 *
 * @see TABLE_ATTRIBUTES
 * @see TABLE_STYLES
 * @param {NamedNodeMap | Attr[]} [attributes] default: []
 * @returns {JQuery}
 */
function _createTable(attributes = []) {
    const table = document.createElement('table');
    Object.entries(TABLE_ATTRIBUTES).forEach(([att, value]) => table.setAttribute(att, value));
    // $table.attr(TABLE_ATTRIBUTES);
    table.style.setProperty('width', '100%', 'important');
    for (const attr of attributes) {
        if (!(attr.name === 'width' && attr.value === '100%')) {
            table.setAttribute(attr.name, attr.value);
        }
    }
    if (table.classList.contains('o_layout')) {
        // The top mailing element inherits the body's font size and line-height
        // and should keep them.
        const layoutStyles = {...TABLE_STYLES};
        delete layoutStyles['font-size'];
        delete layoutStyles['line-height'];
        Object.entries(layoutStyles).forEach(([att, value]) => table.style[att] = value)
    } else {
        for (const styleName in TABLE_STYLES) {
            if (!('style' in attributes && attributes.style.value.includes(styleName + ':'))) {
                table.style[styleName] = TABLE_STYLES[styleName];
            }
        }
    }
    return table;
}
/**
 * Take a Bootstrap grid column element and return its size, computed by using
 * its Bootstrap classes.
 *
 * @see RE_COL_MATCH
 * @see RE_OFFSET_MATCH
 * @param {Element} column
 * @returns {number}
 */
function _getColumnSize(column) {
    const colMatch = column.className.match(RE_COL_MATCH);
    const colOptions = colMatch[2] && colMatch[2].substr(1).split('-');
    const colSize = colOptions && (colOptions.length === 2 ? +colOptions[1] : +colOptions[0]) || 0;
    const offsetMatch = column.className.match(RE_OFFSET_MATCH);
    const offsetOptions = offsetMatch && offsetMatch[2] && offsetMatch[2].substr(1).split('-');
    const offsetSize = offsetOptions && (offsetOptions.length === 2 ? +offsetOptions[1] : +offsetOptions[0]) || 0;
    return colSize + offsetSize;
}
/**
 * Return the CSS rules which applies on an element, tweaked so that they are
 * browser/mail client ok.
 *
 * @param {Node} node
 * @param {Object[]} Array<{selector: string;
 *                          style: {[styleName]: string};
 *                          specificity: number;}>
 * @returns {Object} {[styleName]: string}
 */
function _getMatchedCSSRules(node, cssRules) {
    node.matches = node.matches || node.webkitMatchesSelector || node.mozMatchesSelector || node.msMatchesSelector || node.oMatchesSelector;
    const styles = cssRules.map((rule) => rule.style);

    // Add inline styles at the highest specificity.
    if (node.style.length) {
        const inlineStyles = {};
        for (const styleName of node.style) {
            inlineStyles[styleName] = node.style[styleName];
        }
        styles.push(inlineStyles);
    }

    const aggregatedStyle = {};
    for (const style of styles) {
        for (const [key, value] of Object.entries(style)) {
            if (!aggregatedStyle[key] || !aggregatedStyle[key].includes('important') || value.includes('important')) {
                aggregatedStyle[key] = value;
            }
        }
    }

    for (const [key, value] of Object.entries(aggregatedStyle)) {
        if (value.endsWith('important')) {
            aggregatedStyle[key] = value.replace(/\s*!important\s*$/, '');
        }
    };

    if (aggregatedStyle.display === 'block' && !(node.classList && node.classList.contains('btn-block'))) {
        delete aggregatedStyle.display;
    }
    if (!aggregatedStyle['box-sizing']) {
        aggregatedStyle['box-sizing'] = 'border-box'; // This is by default with Bootstrap.
    }

    // The css generates all the attributes separately and not in simplified
    // form. In order to have a better compatibility (outlook for example) we
    // simplify the css tags. e.g. border-left-style: none; border-bottom-s ....
    // will be simplified in border-style = none
    for (const info of [
        {name: 'margin'},
        {name: 'padding'},
        {name: 'border', suffix: '-style', defaultValue: 'none'},
    ]) {
        const positions = ['top', 'right', 'bottom', 'left'];
        const positionalKeys = positions.map(position => `${info.name}-${position}${info.suffix || ''}`);
        const hasStyles = positionalKeys.some(key => aggregatedStyle[key]);
        const inherits = positionalKeys.some(key => ['inherit', 'initial'].includes((aggregatedStyle[key] || '').trim()));
        if (hasStyles && !inherits) {
            const propertyName = `${info.name}${info.suffix || ''}`;
            aggregatedStyle[propertyName] = positionalKeys.every(key => aggregatedStyle[positionalKeys[0]] === aggregatedStyle[key])
                ? aggregatedStyle[propertyName] = aggregatedStyle[positionalKeys[0]] // top = right = bottom = left => property: [top];
                : positionalKeys.map(key => aggregatedStyle[key] || (info.defaultValue || 0)).join(' '); // property: [top] [right] [bottom] [left];
            for (const prop of positionalKeys) {
                delete aggregatedStyle[prop];
            }
        }
    };

    if (aggregatedStyle['border-bottom-left-radius']) {
        aggregatedStyle['border-radius'] = aggregatedStyle['border-bottom-left-radius'];
        delete aggregatedStyle['border-bottom-left-radius'];
        delete aggregatedStyle['border-bottom-right-radius'];
        delete aggregatedStyle['border-top-left-radius'];
        delete aggregatedStyle['border-top-right-radius'];
    }

    // If the border styling is initial we remove it to simplify the css tags
    // for compatibility. Also, since we do not send a css style tag, the
    // initial value of the border is useless.
    for (const styleName in aggregatedStyle) {
        if (styleName.includes('border') && aggregatedStyle[styleName] === 'initial') {
            delete aggregatedStyle[styleName];
        }
    };

    // text-decoration rule is decomposed in -line, -color and -style. This is
    // however not supported by many browser/mail clients and the editor does
    // not allow to change -color and -style rule anyway
    if (aggregatedStyle['text-decoration-line']) {
        aggregatedStyle['text-decoration'] = aggregatedStyle['text-decoration-line'];
        delete aggregatedStyle['text-decoration-line'];
        delete aggregatedStyle['text-decoration-color'];
        delete aggregatedStyle['text-decoration-style'];
        delete aggregatedStyle['text-decoration-thickness'];
    }

    // flexboxes are not supported in Windows Outlook
    for (const styleName in aggregatedStyle) {
        if (styleName.includes('flex') || `${aggregatedStyle[styleName]}`.includes('flex')) {
            delete aggregatedStyle[styleName];
        }
    }

    return aggregatedStyle;
}
/**
 * Take a css style declaration return a "normalized" version of it (as a
 * standard object) for the purposes of emails. This means removing its styles
 * that are invalid, describe animations or aren't standard css (webkit
 * extensions). It also involves adding the "!important" suffix to styles that
 * have that priority, so they can be handled without access to the full
 * declaration.
 *
 * @param {CSSStyleDeclaration} style
 * @returns {Object} {[styleName]: string}
 */
function _normalizeStyle(style) {
    const normalizedStyle = {};
    for (const styleName of style) {
        const value = style[styleName];
        if (value && !styleName.includes('animation') && !styleName.includes('-webkit') && _.isString(value)) {
            const normalizedStyleName = styleName.replace(/-(.)/g, (a, b) => b.toUpperCase());
            normalizedStyle[styleName] = style[normalizedStyleName];
            if (style.getPropertyPriority(styleName) === 'important') {
                normalizedStyle[styleName] += ' !important';
            }
        }
    }
    return normalizedStyle;
}

//--------------------------------------------------------------------------
// Widget
//--------------------------------------------------------------------------

let cssRulesCachePromise;

FieldHtml.include({
    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @override
     */
     _createWysiwygIntance: async function () {
        await this._super(...arguments);
        // if (this.nodeOptions['style-inline']) {
        cssRulesCachePromise = cssRulesCachePromise || getCSSRules(this.wysiwyg.getEditable()[0].ownerDocument);
        this._cssRulesCachePromise = cssRulesCachePromise;
        // }

        // Use setTimeout in order not to freeze the UI
        setTimeout(() => {
            const fonts = odoo.__DEBUG__.services["wysiwyg.fonts"];
            for (const font of fonts.fontIcons) {
                fonts.getCssSelectors(font.parser);
            }
        }, 0);
    },
    /**
     * @override
     */
    commitChanges: async function () {
        const _super = this._super.bind(this);
        if (this.nodeOptions['style-inline'] && this.mode === "edit") {
            await this._toInline();
        }
        return _super();
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Converts CSS dependencies to CSS-independent HTML.
     * - CSS display for attachment link -> real image
     * - Font icons -> images
     * - CSS styles -> inline styles
     *
     * @private
     */
    _toInline: async function () {
        var $editable = this.wysiwyg.getEditable();
        var html = this.wysiwyg.getValue();
        const $odooEditor = $editable.closest('.odoo-editor');
        // Remove temporarily the class so that css editing will not be converted.
        $odooEditor.removeClass('odoo-editor');
        $editable.html(html);

        const cssRules = await this._cssRulesCachePromise;
        toInline($editable, cssRules, this.wysiwyg.$iframe);
        $odooEditor.addClass('odoo-editor');

        this.wysiwyg.setValue($editable.html(), {
            notifyChange: false,
        });
    },
});

export default {
    addTables: addTables,
    attachmentThumbnailToLinkImg: attachmentThumbnailToLinkImg,
    bootstrapToTable: bootstrapToTable,
    cardToTable: cardToTable,
    classToStyle: classToStyle,
    fontToImg: fontToImg,
    formatTables: formatTables,
    getCSSRules: getCSSRules,
    listGroupToTable: listGroupToTable,
    normalizeColors: normalizeColors,
    normalizeRem: normalizeRem,
    toInline: toInline,
};
