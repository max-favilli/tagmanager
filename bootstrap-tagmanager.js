/**
 * ===================================================
 * bootstrap-tagmanager.js v2.0
 * http://welldonethings.com/tags/manager
 * ===================================================
 * Copyright 2012 Max Favilli
 *
 * Licensed under the Mozilla Public License, Version 2.0 You may not use this work except in compliance with the License.
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

jQuery(function() {

"use strict"; // jshint ;_;

jQuery.fn.tagsManager = function(options) {
    var tagManagerOptions = {
        prefilled: null,
        capitalizeFirstLetter: false,
        preventSubmitOnEnter: true,
        typeahead: null,
        ajaxAdd: null,
        ajaxDelete: null,
        delimeters: [44, 188, 13],
        backspace: [8],
        maxTags: 0,
        tagValuesFieldName: "hidden_" + this.attr('name'),
        deleteTagsOnBackspace: true,
        duplicateHandler: null,
        insertTagHandler: null,
        tagCloseHtml:'x',

        /**
         * Strategy refers to how data is stored locally and posted when
         * the form is submitted.
         *
         * comma-delimited: a hidden field will store all tags in a comma delimited list
         *
         * array: multiple hidden fields will each store one tag with a
         *        common hidden_field_name[] If you use this strategy you _must_ change
         *        your tagValuesFieldName to an array[] ending with [] e.g. tags[]
         */
        strategy: 'comma-delimited'
    };

    jQuery.extend(tagManagerOptions, options);
    jQuery(this).data('tagManagerOptions', tagManagerOptions);

    /**
     * Refresh the selected values tag list hidden field
     */
    jQuery(this).on('refreshTagList', function(e) {
        if (jQuery(this).data('tagManagerOptions').strategy == 'comma-delimited')
            jQuery(jQuery(this).data("tagList")).val(jQuery(this).data("tagStrings").join(",")).change();
    });


    /**
     * Bind remove tag icon
     */
    jQuery('a.tagmanagerRemoveTag').live('click', function(e) {
        jQuery(jQuery(this).parent().data('tagmanager')).trigger('deleteTag', [ jQuery(this).parent() ]);
        return false;
    });

    /**
     * Empty the tag manager
     */
    jQuery(this).on('emptyTags', function(e) {
        jQuery(this).data("tagStrings", new Array());
        jQuery(this).data("tagIds", new Array());

        var field = this;

        jQuery('[id*="tag_"]').each(function(index, node) {
            if (jQuery(this).data('tagmanager') == field)
                jQuery(this).remove();
        });

        jQuery(this).trigger('refreshTagList');
    });

    /**
     * Delete the last tag
     */
    jQuery(this).on('popTag', function (e) {
        if (jQuery(this).data("tagIds").length > 0) {
            var tagIds = jQuery(this).data("tagIds");
            var id = 'tag_' + tagIds[tagIds.length - 1];

            jQuery(this).trigger('deleteTag', [ jQuery('#' + id) ]);
        }
    });

    /**
     * Delete a tag
     */
    jQuery(this).on('deleteTag', function(e, tagHtml) {

        var tagStrings = jQuery(this).data("tagStrings");
        var tagIds = jQuery(this).data("tagIds");

        var p = jQuery.inArray(parseInt(jQuery(tagHtml).attr("tagMarker")), tagIds)

        if (p != -1) {
            if (jQuery(this).data('tagManagerOptions').ajaxDelete != null) {
                jQuery.ajax({
                    url: jQuery(this).data('tagManagerOptions').ajaxDelete,
                    type: 'post',
                    data: {
                        tag: jQuery(tagHtml).attr('tag')
                    },
                    dataType: 'json'
                });
            }

            tagStrings.splice(p, 1);
            tagIds.splice(p, 1);
            jQuery(tagHtml).remove();
            jQuery(this).trigger('refreshTagList');
        }
    });

    /**
     * Add a new tag
     */
     jQuery(this).on('addTag', function (e, tag, skipAjax) {

        // Trim tag
         var txt = jQuery.trim(tag);

         var l = txt.length;
         var t = 0;

         for (var i = l - 1; i >= 0; i--) {
            if (-1 == jQuery.inArray(txt.charCodeAt(i), jQuery(this).data('tagManagerOptions').delimeters)) break;
            t++;
         }

         txt = txt.substring(0, l - t);
         l = txt.length;
         t = 0;

         //remove from head
         for (var i = 0; i < l; i++) {
            if (-1 == jQuery.inArray(txt.charCodeAt(i), jQuery(this).data('tagManagerOptions').delimeters)) break;
            t++;
         }

         tag  = txt.substring(t, l);
        // End trim

         if (!tag || tag.length <= 0) return;

         if (jQuery(this).data('tagManagerOptions').capitalizeFirstLetter) {
            tag = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
         }

         if (jQuery(this).data('tagManagerOptions').validator !== undefined) {
           if ( jQuery(this).data('tagManagerOptions').validator(tag) !== true ) return;
         }

         var tagStrings = jQuery(this).data("tagStrings");
         var tagIds = jQuery(this).data("tagIds");

         if ( jQuery(this).data('tagManagerOptions').maxTags > 0 && tagStrings.length >= jQuery(this).data('tagManagerOptions').maxTags ) return;

        if (jQuery.inArray(tag, tagStrings) != -1) {
            if (jQuery(this).duplicateHandler) jQuery(this).duplicateHandler(tagIds[p]);
            jQuery(this).focus();
            return;
        }

        if (jQuery(this).data('tagManagerOptions').ajaxAdd != null && !skipAjax) {
            jQuery.ajax({
                url: jQuery(this).data('tagManagerOptions').ajaxAdd,
                type: 'post',
                data: {
                    tag: tag
                },
                dataType: 'json'
            });
        }

        var tagId = +new Date(); // fetch ms
        tagStrings.push(tag);
        tagIds.push(tagId);


        var newTagId = 'tag_' + tagId;
        var newTagRemoveId = 'tag_remover_' + tagId;

        var tagHtml = jQuery('<span></span>')
            .addClass('tagmanagerTag')
            .attr('tag', tag)
            .attr('tagMarker', tagId)
            .attr('id', newTagId)
            .data('tagmanager', this)
            .text(tag);

        if (jQuery(this).data('tagManagerOptions').strategy == 'array') {
            jQuery('<input></input>')
                .attr('type', 'hidden')
                .attr('name', jQuery(this).data('tagManagerOptions').tagValuesFieldName)
                .val(tag)
                .appendTo(tagHtml);
        }


        var tagRemover = jQuery('<a></a>')
            .addClass('tagmanagerRemoveTag')
            .attr('title', 'Remove')
            .attr('href', '#')
            .html(jQuery(this).data('tagManagerOptions').tagCloseHtml)
            .appendTo(tagHtml);

        if(jQuery(this).data('tagManagerOptions').insertTagHandler != null) {
            jQuery(this).data('tagManagerOptions').insertTagHandler(tagHtml);
        }else {
            jQuery(this).before(tagHtml);
        }

        jQuery(this).trigger('refreshTagList');

        if (jQuery(this).data('tagManagerOptions').maxTags > 0 && tagStrings.length >= jQuery(this).data('tagManagerOptions').maxTags ) {
            jQuery(this).hide();
        }

        jQuery(this).data('typeahead').hide();
        jQuery(this).val('');
        jQuery(this).focus();
    });

    /**
     * Import prefilled tags without triggering ajaxAdd
     */
    jQuery(this).on('importTags', function (e, tags) {
        var field = this;

        if (typeof (tags) == "object") {
            jQuery.each(tags, function (key, val) {
                jQuery(field).trigger('addTag', [ val, true ]);
            });
        } else if (typeof (tags) == "string") {
            jQuery.each(tags.split(','), function (key, val) {
                jQuery(field).trigger('addTag', [ val, true ]);
            });
        }
    });

    /**
     * Prevent submit on enter
     */
    jQuery(this).keypress(function(e) {
        if (jQuery(this).data('tagManagerOptions').preventSubmitOnEnter) {
            if (e.which == 13) {
                e.stopPropagation();
                e.preventDefault();
            }
        }
    });

    /**
     * If backspace then delete latest tag
     */
    jQuery(this).keydown(function(e) {
        if(!jQuery(this).data('tagManagerOptions').deleteTagsOnBackspace) return;

        if (jQuery.inArray(e.which, jQuery(this).data('tagManagerOptions').backspace) != -1) {
            // backspace or equivalent
            if (!jQuery(this).val()) {
                e.preventDefault();
                jQuery(this).trigger('popTag');
            }
        }
    });

    /**
     * If a delimiting key is pressed, add the current value
     */
    jQuery(this).keyup(function (e) {
        if (jQuery.inArray(e.which, jQuery(this).data('tagManagerOptions').delimeters) != -1) {
            e.preventDefault();

            // If the typeahead is selected use that value else use field value
            if (jQuery(this).data('typeahead').shown
                && jQuery(this).data('typeahead').$menu.find('.active').length
            ) {
                jQuery(this).val(jQuery(this).data('typeahead').$menu.find('.active').attr('data-value'));
            }

            jQuery(this).trigger('addTag', [ jQuery(this).val() ]);
        }
    });

    // store instance specific data
    jQuery(this).data("tagStrings", new Array()); //list of string tags
    jQuery(this).data("tagIds", new Array()); //list of ID of the string tags


    switch (jQuery(this).data('tagManagerOptions').strategy) {
        case 'array':
            break;

        case 'comma-delimited':
        default:
            var hiddenTagsField = jQuery('<input></input')
                .attr('name', jQuery(this).data('tagManagerOptions').tagValuesFieldName)
                .attr('type', 'hidden')
                .val('');

            jQuery(this).after(hiddenTagsField);
            jQuery(this).data("tagList", hiddenTagsField);
            break;
    }

    if (jQuery(this).data('tagManagerOptions').typeahead) {
        jQuery(this).typeahead(jQuery(this).data('tagManagerOptions').typeahead);
    }

    if (jQuery(this).data('tagManagerOptions').prefilled) {
        jQuery(this).trigger('importTags', [ jQuery(this).data('tagManagerOptions').prefilled ]);
    }
}

});
