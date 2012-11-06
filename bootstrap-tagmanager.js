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
        CapitalizeFirstLetter: false,
        preventSubmitOnEnter: true,
        typeahead: false,
        ajaxAdd: null,
        ajaxDelete: null,
        delimeters: [44, 188, 13],
        backspace: [8],
        maxTags: 0,
        hiddenTagListName: "hidden-" + this.attr('name'),
        deleteTagsOnBackspace: true,
        notifyDuplicate: null,
        tagsContainer: null,
        tagCloseIcon:'x'
    };

    jQuery.extend(tagManagerOptions, options);

    var field = this;
    var lastTagId = 0;

    /**
     * Refresh the selected values tag list hidden field
     */
    jQuery(this).on('refreshTagList', function(e) {
        jQuery(jQuery(this).data("tagList")).val(jQuery(this).data("tlis").join(",")).change();
    });


    /**
     * Bind remove tag icon
     */
    jQuery('a.myTagRemover').live('click', function(e) {
        jQuery(jQuery(this).parent().data('tagmanager')).trigger('deleteTag', [ jQuery(this).parent() ]);
        return false;
    });

    /**
     * Delete the last tag
     */
    jQuery(this).on('popTag', function (e) {
        if (jQuery(this).data("tlid").length > 0) {
            var tlid = jQuery(this).data("tlid");
            var tagId = tlid[tlid.length - 1];

            var id = jQuery(this).attr('name') + '_' + tagId;

            jQuery(this).trigger('deleteTag', [ jQuery('#' + id) ]);
        }
    });

    /**
     * Delete a tag
     */
    jQuery(this).on('deleteTag', function(e, tagHtml) {

        var tlis = field.data("tlis");
        var tlid = field.data("tlid");

        var p = jQuery.inArray(parseInt(jQuery(tagHtml).attr("tagMarker")), tlid)

        if (-1 != p) {
            if (tagManagerOptions.ajaxDelete != null) {
                jQuery.ajax({
                    url: tagManagerOptions.ajaxDelete,
                    type: 'post',
                    data: {
                        tag: jQuery(tagHtml).attr('tag')
                    },
                    dataType: 'json'
                });
            }

            tlis.splice(p, 1);
            tlid.splice(p, 1);
            jQuery(tagHtml).remove();
            jQuery(this).trigger('refreshTagList');
        }
    });

    /**
     * Add a new tag
     */
     jQuery(this).on('addTag', function (e, tag) {

        // Trim tag
         var txt = jQuery.trim(tag);

         var l = txt.length;
         var t = 0;

         for (var i = l - 1; i >= 0; i--) {
            if (-1 == jQuery.inArray(txt.charCodeAt(i), tagManagerOptions.delimeters)) break;
            t++;
         }

         txt = txt.substring(0, l - t);
         l = txt.length;
         t = 0;

         //remove from head
         for (var i = 0; i < l; i++) {
            if (-1 == jQuery.inArray(txt.charCodeAt(i), tagManagerOptions.delimeters)) break;
            t++;
         }

         tag  = txt.substring(t, l);
        // End trim

         if (!tag || tag.length <= 0) return;

         if (tagManagerOptions.CapitalizeFirstLetter) {
            tag = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
         }

         if (tagManagerOptions.validator !== undefined) {
           if ( tagManagerOptions.validator(tag) !== true ) return;
         }

         var tlis = jQuery(this).data("tlis");
         var tlid = jQuery(this).data("tlid");

         if ( tagManagerOptions.maxTags > 0 && tlis.length >= tagManagerOptions.maxTags ) return;

        if (jQuery.inArray(tag, tlis) != -1) {
            if (jQuery(this).notifyDuplicate) jQuery(this).notifyDuplicate(tlid[p]);
        }

        var tagId = lastTagId++;
        tlis.push(tag);
        tlid.push(tagId);

        if (tagManagerOptions.ajaxAdd != null) {
            jQuery.ajax({
                url: tagManagerOptions.ajaxAdd,
                type: 'post',
                data: {
                    tag: tag
                },
                dataType: 'json'
            });
        }

        var newTagId = jQuery(this).attr('name') + '_' + tagId;
        var newTagRemoveId = jQuery(this).attr('name') + '_Remover_' + tagId;

        var tagHtml = $('<span></span>')
            .addClass('myTag')
            .attr('tag', tag)
            .attr('tagMarker', tagId)
            .attr('id', newTagId)
            .data('tagmanager', this)
            .text(tag);
        var tagRemover = $('<a></a>')
            .addClass('myTagRemover')
            .attr('title', 'Remove')
            .attr('href', '#')
            .text(tagManagerOptions.tagCloseIcon)
            .appendTo(tagHtml);

        if(tagManagerOptions.tagsContainer != null) {
            jQuery(tagManagerOptions.tagsContainer).append(tagHtml)
        }else {
            jQuery(this).before(tagHtml);
        }

        jQuery(this).trigger('refreshTagList');

        if (tagManagerOptions.maxTags > 0 && tlis.length >= tagManagerOptions.maxTags ) {
            jQuery(this).hide();
        }

        jQuery(this).data('typeahead').hide();
        jQuery(this).val('');
        jQuery(this).focus();
    });

    /**
     * Prevent submit on enter
     */
    jQuery(this).keypress(function(e) {
        if (tagManagerOptions.preventSubmitOnEnter) {
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
        if(!tagManagerOptions.deleteTagsOnBackspace) return;

        if (jQuery.inArray(e.which, tagManagerOptions.backspace) != -1) {
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
        if (jQuery.inArray(e.which, tagManagerOptions.delimeters) != -1) {
            e.preventDefault();
            jQuery(this).trigger('addTag', [ jQuery(this).val() ]);
        }
    });

    /**
     * Populate prefilled values
     */
    // store instance specific data
    jQuery(this).data("tlis", new Array()); //list of string tags
    jQuery(this).data("tlid", new Array()); //list of ID of the string tags

    jQuery(this).after('<input name="' + tagManagerOptions.hiddenTagListName + '" type="hidden" value=""/>');

    jQuery(this).data("tagList",
        this.siblings("input[name='" + tagManagerOptions.hiddenTagListName + "']")[0]
    );

    if (tagManagerOptions.typeahead) {
        $(this).typeahead(tagManagerOptions.typeahead);
    }

    if (tagManagerOptions.prefilled != null) {
        if (typeof (tagManagerOptions.prefilled) == "object") {
            jQuery.each(tagManagerOptions.prefilled, function (key, val) {
                $(field).trigger('addTag', [ val ]);
            });
        } else if (typeof (tagManagerOptions.prefilled) == "string") {
            jQuery.each(tagManagerOptions.prefilled.split(','), function (key, val) {
                $(field).trigger('addTag', [ val ]);
            });
        }
    }
}

});
