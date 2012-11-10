/**
 * ===================================================
 * bootstrap-tagmanager.js v2.0
 * http://welldonethings.com/tags/manager
 * ===================================================
 * Copyright 2012 Max Favilli
 *
 * Licensed under the Mozilla Public License, Version 2.0 You may not use
 * this work except in compliance with the License.
 *
 * http://www.mozilla.org/MPL/2.0/
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ==========================================================
 */

$(function() {

"use strict"; // jshint ;_;

$.fn.tagManager = function(options)
{
    var tagManagerOptions = {
        prefilled: null,
        capitalizeFirstLetter: false,
        deleteTagsOnBackspace: true,
        preventSubmitOnEnter: true,
        typeahead: null,
        delimeters: [44, 188, 13],
        backspace: [8],
        maxTags: 0,
        tagValuesFieldName: "hidden_" + this.attr('name'),
        tagCloseHtml: 'x',

        insertTagHandler: null,
        duplicateHandler: function(tag) {
            return false;
        },
        validatorHandler: function(tag) {
            return tag;
        },

        /**
         * Used for strategy: 'ajax'
         */
        ajaxAdd: null,
        ajaxDelete: null,

        /**
         * Strategy refers to how data is stored locally and posted when
         * the form is submitted.
         *
         * csv: a hidden field will store all tags in a comma delimited list
         *
         * ajax: tags are added and removed over ajax with no local storage
         *
         * array: multiple hidden fields will each store one tag with a
         *        common hidden_field_name[] If you use this strategy you _must_ change
         *        your tagValuesFieldName to an array[] ending with [] e.g. tags[]
         */
        strategy: 'csv'
    };

    $.extend(tagManagerOptions, options);
    $(this).data('tagManagerOptions', tagManagerOptions);

    /**
     * Refresh the selected values tag list hidden field
     */
    $(this).on('refreshTagList', function(e)
    {
        if ($(this).data('tagManagerOptions').strategy == 'csv')
            $($(this).data("tagList")).val(
                $(this).data('tagStrings').join(",")).change();
    });


    /**
     * Bind remove tag icon
     */
    $('a.tagmanagerRemoveTag').live('click', function(e)
    {
        $($(this).parent().data('tagmanager')).trigger('deleteTag',
            [ $(this).parent() ]);
        return false;
    });

    /**
     * Empty the tag manager
     */
    $(this).on('emptyTags', function(e)
    {
        $(this).data('tagStrings', new Array());
        $(this).data('tagIds', new Array());

        var field = this;

        $('[id*="tag_"]').each(function(index, node) {
            if ($(this).data('tagmanager') == field)
                $(this).remove();
        });

        $(this).trigger('refreshTagList');
    });

    /**
     * Delete the last tag
     */
    $(this).on('popTag', function (e)
    {
        if ($(this).data('tagIds').length > 0) {
            var id = $(this).data('tagIds')[$(this).data('tagIds').length - 1];

            $(this).trigger('deleteTag', [ $('#' + id) ]);
        }
    });

    /**
     * Delete a tag
     */
    $(this).on('deleteTag', function(e, tagHtml)
    {
        var p = $.inArray($(tagHtml).attr('id'), $(this).data('tagIds'));
        if (p != -1) {
            if ($(this).data('tagManagerOptions').ajaxDelete != null) {
                $.ajax({
                    url: $(this).data('tagManagerOptions').ajaxDelete,
                    type: 'post',
                    data: {
                        tag: $(tagHtml).attr('tag')
                    },
                    dataType: 'json'
                });
            }

            $(this).data('tagStrings').splice(p, 1);
            $(this).data('tagIds').splice(p, 1);
            $(tagHtml).remove();
            $(this).trigger('refreshTagList');
        }
    });

    /**
     * Add a new tag
     */
     $(this).on('addTag', function (e, tag, skipAjax)
     {
        var tag = $.trim(tag);
        if (!tag) return;

        // Caps first letter
        if ($(this).data('tagManagerOptions').capitalizeFirstLetter) {
            tag = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
        }

        // Validate Tag
        if ($(this).data('tagManagerOptions').validatorHandler) {
            tag = $(this).data('tagManagerOptions').validatorHandler(tag);
            if (!tag) return;
        }

        // Check max tags
        if ($(this).data('tagManagerOptions').maxTags > 0
            && $(this).data('tagStrings').length >= $(this).data('tagManagerOptions').maxTags) {
            $(this).attr('originalPlaceholder', $(this).attr('placeholder'));
            $(this).attr('placeholder', 'Maximum of ' + $(this).data('tagManagerOptions').maxTags + ' tags');
            $(this).val('');
            return;
        }

        // Check for duplicates and run handler
        if ($(this).data('tagManagerOptions').duplicateHandler)
            var index = $.inArray(tag, $(this).data('tagStrings'));
            if (index != -1) {
                tag = $(this).data('tagManagerOptions').duplicateHandler(tag);
            if (!tag) return;
        }

        // Run ajax
        if ($(this).data('tagManagerOptions').ajaxAdd != null && !skipAjax) {
            $.ajax({
                url: $(this).data('tagManagerOptions').ajaxAdd,
                type: 'post',
                data: {
                    tag: tag
                },
                dataType: 'json'
            });
        }

        // Build new tag
        var randomString = function(length) {
            var result = '';
            var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
            return result;
        };

        var tagId = 'tag_' + randomString(32);
        var newTagRemoveId = 'tag_remover_' + tagId;

        $(this).data('tagStrings').push(tag);
        $(this).data('tagIds').push(tagId);

        var tagHtml = $('<span></span>')
            .addClass('tagmanagerTag')
            .attr('tag', tag)
            .attr('id', tagId)
            .data('tagmanager', this)
            .text(tag);

        // Handle array strategy
        if ($(this).data('tagManagerOptions').strategy == 'array') {
            $('<input></input>')
                .attr('type', 'hidden')
                .attr('name', $(this).data('tagManagerOptions').tagValuesFieldName)
                .val(tag)
                .appendTo(tagHtml);
        }

        // Build remove link
        var tagRemover = $('<a></a>')
            .addClass('tagmanagerRemoveTag')
            .attr('title', 'Remove')
            .attr('href', '#')
            .html($(this).data('tagManagerOptions').tagCloseHtml)
            .appendTo(tagHtml);

        // Run custom insert tag handler
        if($(this).data('tagManagerOptions').insertTagHandler != null) {
            $(this).data('tagManagerOptions').insertTagHandler(tagHtml);
        }else {
            $(this).before(tagHtml);
        }

        $(this).trigger('refreshTagList');

        $(this).data('typeahead').hide();
        $(this).val('');
        $(this).focus();
    });

    /**
     * Import prefilled tags without triggering ajaxAdd
     */
    $(this).on('importTags', function (e, tags)
    {
        var field = this;

        if (typeof (tags) == "object") {
            $.each(tags, function (key, val) {
                $(field).trigger('addTag', [ val, true ]);
            });
        } else if (typeof (tags) == "string") {
            $.each(tags.split(','), function (key, val) {
                $(field).trigger('addTag', [ val, true ]);
            });
        }
    });

    /**
     * Prevent submit on enter
     */
    $(this).keypress(function(e)
    {
        if ($(this).data('tagManagerOptions').preventSubmitOnEnter) {
            if (e.which == 13) {
                e.stopPropagation();
                e.preventDefault();
            }
        }
    });

    /**
     * If backspace then delete latest tag
     */
    $(this).keydown(function(e)
    {
        if(!$(this).data('tagManagerOptions').deleteTagsOnBackspace) return;

        if ($.inArray(e.which, $(this).data('tagManagerOptions').backspace) != -1) {
            // backspace or equivalent
            if (!$(this).val()) {
                e.preventDefault();
                $(this).trigger('popTag');
            }
        }
    });

    /**
     * If a delimiting key is pressed, add the current value
     */
    $(this).keyup(function (e)
    {
        if ($.inArray(e.which, $(this).data('tagManagerOptions').delimeters) != -1) {
            e.preventDefault();

            // If the typeahead is selected use that value else use field value
            if ($(this).data('typeahead').shown
                && $(this).data('typeahead').$menu.find('.active').length
            ) {
                $(this).val($(this).data('typeahead').$menu.find('.active').attr('data-value'));
            }

            // For non enter keystrokes trim last character from value
            if (e.which != 13)
                $(this).val($(this).val().substr(0, $(this).val().length -1));

            $(this).trigger('addTag', [ $(this).val() ]);
        }
    });

    // Initialize the manager
    $(this).data('tagStrings', new Array());
    $(this).data('tagIds', new Array());

    switch ($(this).data('tagManagerOptions').strategy) {
        case 'array':
            break;

        case 'ajax':
            break;

        case 'csv':
        default:
            var hiddenTagsField = $('<input></input')
                .attr('name', $(this).data('tagManagerOptions').tagValuesFieldName)
                .attr('type', 'hidden')
                .val('');

            $(this).after(hiddenTagsField);
            $(this).data("tagList", hiddenTagsField);
            break;
    }

    // Init bootstrap typeahead
    if ($(this).data('tagManagerOptions').typeahead) {
        $(this).typeahead($(this).data('tagManagerOptions').typeahead);
    }

    // Pre-populate values
    if ($(this).data('tagManagerOptions').prefilled) {
        $(this).trigger('importTags',
            [ $(this).data('tagManagerOptions').prefilled ]);
    }
}

});
