/* ===================================================
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
 * ========================================================== */

 "use strict";

jQuery(function() {

   jQuery.fn.tagsManager = function (options) {
      var tagManagerOptions = {
         prefilled: null,
         CapitalizeFirstLetter: false,
         preventSubmitOnEnter: true,
         typeahead: false,
         typeaheadAjaxSource: null,
         typeaheadAjaxPolling: false,
         typeaheadSource: null,
         typeaheadDelegate: null, // An object of config options to be passed to bootstrap-typeahead
         ajaxAdd: null,
         ajaxDelete: null,
         delimeters: [44, 188, 13],
         backspace: [8],
         maxTags: 0,
         hiddenTagListName: null,
         deleteTagsOnBackspace: true,
         tagsContainer: null,
         tagCloseIcon:'x'
      };

      jQuery.extend(tagManagerOptions, options);

      if(tagManagerOptions.hiddenTagListName === null){
         tagManagerOptions.hiddenTagListName = "hidden-"+this.attr('name');
      }

      var obj = this;
      var objName = obj.attr('name');
      var lastTagId = 0;
      var lastTag = '';
      var delimeters = tagManagerOptions.delimeters;
      var backspace = tagManagerOptions.backspace;

      var setupTypeahead = function () {
         if(!tagManagerOptions.typeahead) return;

         if (tagManagerOptions.typeaheadSource != null && jQuery.isFunction(tagManagerOptions.typeaheadSource)) {
           obj.typeahead({ source: tagManagerOptions.typeaheadSource });
         } else if (tagManagerOptions.typeaheadSource != null) {
           obj.typeahead();
           obj.data('active', true);
           obj.data('typeahead').source = tagManagerOptions.typeaheadSource;
           obj.data('active', false);
         } else if (tagManagerOptions.typeaheadAjaxSource != null) {
           if (!tagManagerOptions.typeaheadAjaxPolling) {
               obj.typeahead();
               jQuery.getJSON(tagManagerOptions.typeaheadAjaxSource, function (data) {
                  var sourceAjaxArray = [];
                  if (data != undefined && data.tags != undefined) {
                     sourceAjaxArray.length = 0;
                     jQuery.each(data.tags, function (key, val) {
                        var a = 1;
                        sourceAjaxArray.push(val.tag);
                        obj.data('active', true);
                        obj.data('typeahead').source = sourceAjaxArray;
                        obj.data('active', false);
                     });
                  }
               });
            }else if(tagManagerOptions.typeaheadAjaxPolling){
               obj.typeahead({source: ajaxPolling});
            }
         } else if (tagManagerOptions.typeaheadDelegate) {
             obj.typeahead(tagManagerOptions.typeaheadDelegate)
         }
      };

      var ajaxPolling = function (query,process) {
         jQuery.getJSON(tagManagerOptions.typeaheadAjaxSource, function (data) {
            var sourceAjaxArray = [];
            if (data != undefined && data.tags != undefined) {
               sourceAjaxArray.length = 0;
               jQuery.each(data.tags, function (key, val) {
                  var a = 1;
                  sourceAjaxArray.push(val.tag);
               });
               process(sourceAjaxArray);
            }
         });
      };

      var trimTag = function (tag) {
         var txt = jQuery.trim(tag);

         var l = txt.length;
         var t = 0;

         for (var i = l - 1; i >= 0; i--) {
            if (-1 == jQuery.inArray(txt.charCodeAt(i), delimeters)) break;
            t++;
         }

         txt = txt.substring(0, l - t);
         l = txt.length;
         t = 0;

         //remove from head
         for (var i = 0; i < l; i++) {
            if (-1 == jQuery.inArray(txt.charCodeAt(i), delimeters)) break;
            t++;
         }

         txt = txt.substring(t, l);
         return txt;
      };

      var refreshHiddenTagList = function () {
         var tlis = obj.data("tlis");
         var lhiddenTagList = obj.data("lhiddenTagList");

         if(lhiddenTagList == undefined)
            return;

         jQuery(lhiddenTagList).val(tlis.join(",")).change();
      };

      var spliceTag = function (tagId) {
         var tlis = obj.data("tlis");
         var tlid = obj.data("tlid");

         var p = jQuery.inArray(tagId, tlid)

         if (-1 != p) {
            jQuery("#"+objName+"_"+ tagId).remove();
            tlis.splice(p, 1);
            tlid.splice(p, 1);
            refreshHiddenTagList();
         }

         if (tagManagerOptions.maxTags > 0 && tlis.length < tagManagerOptions.maxTags ) {
            obj.show();
         }
      }

    /**
     * Delete the last tag
     */
    $(this).on('popTag', function (e) {
        if ($(this).data("tlid").length > 0) {
            var tagId = $(this).data("tlid").pop();
            $(this).data("tlis").pop();
            // console.log("TagIdToRemove: " + tagId);
            jQuery("#"+objName+"_"+ tagId).remove();
            refreshHiddenTagList();
        }
    });

    /**
     * Add a new tag
     */
      $(this).on('pushTag', function (e, tag) {
         tag = trimTag(tag);
         if (!tag || tag.length <= 0) return;

         lastTag = tag;

         if (tagManagerOptions.CapitalizeFirstLetter) {
            tag = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
         }

         // call the validator (if any) and do not let the tag pass if invalid
         if (tagManagerOptions.validator !== undefined) {
           if ( tagManagerOptions.validator(tag) !== true ) return;
         }

         var tlis = obj.data("tlis");
         var tlid = obj.data("tlid");

         // dont accept new tags beyond the defined maximum
         if ( tagManagerOptions.maxTags > 0 && tlis.length >= tagManagerOptions.maxTags ) return;

         var alreadyInList = false;
         var p = jQuery.inArray(tag, tlis);
         if (-1 != p) {
            // console.log("tag:" + tag + " !!already in list!!");
            alreadyInList = true;
         }

         if (alreadyInList) {
            var pTagId = tlid[p];
            jQuery("#"+objName+"_"+ pTagId).stop()
               .animate({ backgroundColor: tagManagerOptions.blinkBGColor_1 }, 100)
               .animate({ backgroundColor: tagManagerOptions.blinkBGColor_2 }, 100)
               .animate({ backgroundColor: tagManagerOptions.blinkBGColor_1 }, 100)
               .animate({ backgroundColor: tagManagerOptions.blinkBGColor_2 }, 100)
               .animate({ backgroundColor: tagManagerOptions.blinkBGColor_1 }, 100)
               .animate({ backgroundColor: tagManagerOptions.blinkBGColor_2 }, 100);
         } else {
            var tagId = lastTagId++;
            tlis.push(tag);
            tlid.push(tagId);

            if (tagManagerOptions.ajaxAdd != null){
               jQuery.post(tagManagerOptions.ajaxAdd, {tag: tag});
            }

            // console.log("tagList: " + tlis);

            var newTagId = objName+'_'+tagId;
            var newTagRemoveId = objName+'_Remover_'+ tagId;
            var html = '';
            html += '<span class="myTag" id="'+newTagId+ '"><span>' + tag + '&nbsp;&nbsp;</span><a href="#" class="myTagRemover" id="'+newTagRemoveId+'" TagIdToRemove="'+tagId+'" title="Remove">'+tagManagerOptions.tagCloseIcon+'</a></span>';

            if(tagManagerOptions.tagsContainer != null)
            {
               jQuery(tagManagerOptions.tagsContainer).append(html)
            }else {
               obj.before(html);
            }

            jQuery("#"+newTagRemoveId).on("click", obj, function (e) {
                e.preventDefault();

                if (tagManagerOptions.ajaxDelete != null){
                    jQuery.ajax({
                        type: 'post',
                        url: tagManagerOptions.ajaxDelete,
                        data: {
                            tag: tag
                        },
                        dataType: 'json'
                    });
                }

                var TagIdToRemove = parseInt(jQuery(this).attr("TagIdToRemove"));
                spliceTag(TagIdToRemove,e.data);
            });

            refreshHiddenTagList();

            if (tagManagerOptions.maxTags > 0 && tlis.length >= tagManagerOptions.maxTags ) {
               obj.hide();
            }
         }

        jQuery(this).data('typeahead').hide();
        jQuery(this).val('');
        jQuery(this).focus();
    });

     // store instance specific data
     this.data("tlis", new Array()); //list of string tags
     this.data("tlid", new Array()); //list of ID of the string tags


     jQuery(this).after('<input name="' + tagManagerOptions.hiddenTagListName + '" type="hidden" value=""/>');

     this.data("lhiddenTagList",
        this.siblings("input[name='" + tagManagerOptions.hiddenTagListName + "']")[0]
     );

    if (tagManagerOptions.typeahead) setupTypeahead();

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

        if (jQuery.inArray(e.which, backspace) != -1) {
            // backspace or equivalent
            if (!$(this).val()) {
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
            jQuery(this).trigger('pushTag', [ jQuery(this).val() ]);
        }
    });

    if (tagManagerOptions.prefilled != null) {
        if (typeof (tagManagerOptions.prefilled) == "object") {
            var pta = tagManagerOptions.prefilled;
            jQuery.each(pta, function (key, val) {
                var a = 1;
                jQuery(obj).trigger('pushTag', [ val ]);
                jQuery(obj).val('');
                });
            } else if (typeof (tagManagerOptions.prefilled) == "string") {
                var pta = tagManagerOptions.prefilled.split(',');

                jQuery.each(pta, function (key, val) {
                    var a = 1;
                    jQuery(obj).trigger('pushTag', [ val ]);
                    jQuery(obj).val('');
                });

            }
        }
    }
});
