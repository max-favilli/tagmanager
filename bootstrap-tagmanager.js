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

(function (jQuery) {
   if (typeof console === "undefined" || typeof console.log === "undefined") {
      console = {};
      console.log = function () { };
   }

   jQuery.fn.tagsManager = function (options) {
      var tagManagerOptions = {
         prefilled: null,
         CapitalizeFirstLetter: false,
         preventSubmitOnEnter: true,
         typeahead: false,
         typeaheadAjaxSource: null,
         typeaheadAjaxPolling: false,
         typeaheadSource: null,
         AjaxPush: null,
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
      var queuedTag = "";
      var delimeters = tagManagerOptions.delimeters;
      var backspace = tagManagerOptions.backspace;

      var setupTypeahead = function () {
         if(!obj.typeahead) return;

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

      var popTag = function () {
         var tlis = obj.data("tlis");
         var tlid = obj.data("tlid");

         if (tlid.length > 0) {
            var tagId = tlid.pop();
            tlis.pop();
            // console.log("TagIdToRemove: " + tagId);
            jQuery("#"+objName+"_"+ tagId).remove();
            refreshHiddenTagList();
            // console.log(tlis);
         }
      }

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
         
         // console.log("TagIdToRemove: " + tagId);
         // console.log("position: " + p);

         if (-1 != p) {
            jQuery("#"+objName+"_"+ tagId).remove();
            tlis.splice(p, 1);
            tlid.splice(p, 1);
            refreshHiddenTagList();
            // console.log(tlis);
         }

         if (tagManagerOptions.maxTags > 0 && tlis.length < tagManagerOptions.maxTags ) {
            obj.show();
         }
      }

      var pushTag = function (tag) {
         if (!tag || tag.length <= 0) return;

         if (tagManagerOptions.CapitalizeFirstLetter && tag.length > 1) {
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
            jQuery(objName+"_"+ pTagId).stop()
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

            if (tagManagerOptions.AjaxPush != null){
               jQuery.post(tagManagerOptions.AjaxPush, {tag: tag});
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
               var TagIdToRemove = parseInt(jQuery(this).attr("TagIdToRemove"));
               spliceTag(TagIdToRemove,e.data);
            });

            refreshHiddenTagList();

            if (tagManagerOptions.maxTags > 0 && tlis.length >= tagManagerOptions.maxTags ) {
               obj.hide();
            }
         }
         obj.val("");
      };

      return this.each(function() {

         //let's store some instance specific data directly into the DOM object
         var tlis = new Array();
         var tlid = new Array();
         obj.data("tlis", tlis); //list of string tags
         obj.data("tlid", tlid); //list of ID of the string tags

         var html = "";
         html += "<input name='" + tagManagerOptions.hiddenTagListName + "' type='hidden' value=''/>";
         obj.after(html);
         obj.data("lhiddenTagList", 
            obj.siblings("input[name='" + tagManagerOptions.hiddenTagListName + "']")[0]
         );

         if (tagManagerOptions.typeahead) {
            setupTypeahead();
            //obj.typeahead({ source: SourceArray })
         }

         obj.on("focus", function (e) {
            if (jQuery(this).popover) {
               jQuery(this).popover("hide");
               //jQuery(this).popover = null;
            }
         });

         // disable submit on enter for this input field
         obj.on("keypress", function (e) {
            if (jQuery(this).popover) {
               jQuery(this).popover("hide");
               //jQuery(this).popover = null;
            }
            if (tagManagerOptions.preventSubmitOnEnter) {
               if (e.which == 13) {
                  e.cancelBubble = true;
                  e.returnValue = false;
                  e.stopPropagation();
                  e.preventDefault();
                  //e.keyCode = 9;
               }
            }
            // console.log("keyup: " + e.keyCode);
         });

         obj.on("keyup", obj, function (e) {
            var p = jQuery.inArray(e.which, delimeters);
            if (-1 != p) {
               //user just entered a valid delimeter
               var user_input = jQuery(this).val(); //user_input = jQuery().inArray(delimeters[p]);
               user_input = trimTag(user_input);
               pushTag(user_input,e.data);
               // console.log("pushTag: keyup");
            }

           // console.log("keyup: " + e.which);
         });

         if(tagManagerOptions.deleteTagsOnBackspace){
            obj.on("keydown", obj, function (e) {
               var p = jQuery.inArray(e.which, backspace);
               if (-1 != p) {
                  //user just entered backspace or equivalent
                  var user_input = jQuery(this).val(); //user_input = jQuery().inArray(delimeters[p]);
                  var i = user_input.length;
                  if (i <= 0) {
                     // console.log("backspace detected");
					 e.preventDefault();
                     popTag();
                  }
               }
            });
         }

         obj.change(function (e) {
            e.cancelBubble = true;
            e.returnValue = false;
            e.stopPropagation();
            e.preventDefault();

            var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
            var is_explorer = navigator.userAgent.indexOf('MSIE') > -1;
            var is_firefox = navigator.userAgent.indexOf('Firefox') > -1;
            var is_safari = navigator.userAgent.indexOf("Safari") > -1;
            
            if(!is_chrome && !is_safari )
               jQuery(this).focus();

            // console.log('Handler for .change() called, value selected:' + obj.val());
            var ao = jQuery(".typeahead:visible");
            if (ao[0] != undefined){
               // console.log('change: typeaheadIsVisible is visible');
               //when the user click with the mouse on the typeahead li element we get the change event fired twice, once when the input field loose focus and later with the input field value is replaced with li value
               var user_input = jQuery(".typeahead .active").attr("data-value"); 
               user_input = trimTag(user_input);
               if( queuedTag == obj.val() && queuedTag == user_input ){
                  queuedTag = "";
                  obj.val(queuedTag);
               }else{
                  pushTag(user_input);
                  queuedTag = user_input;
                  // console.log('Handler for .change() called, typeahead value pushed:' + queuedTag);
               }
            } else {
               // console.log('change: typeaheadIsVisible is NOT visible');
               var user_input = jQuery(this).val(); //user_input = jQuery().inArray(delimeters[p]);
               user_input = trimTag(user_input);
               pushTag(user_input);
               // console.log("pushTag: change ");
            }

         });

         if (1 == 1 || !tagManagerOptions.typeahead) {
            obj.on("blur", function (e) {
               //lost focus
               e.cancelBubble = true;
               e.returnValue = false;
               e.stopPropagation();
               e.preventDefault();

               var push = true;
               if (tagManagerOptions.typeahead) {
                  var ao = jQuery(".typeahead:visible");
                  if (ao[0] != undefined) {
                     // console.log('blur: typeaheadIsVisible is visible');
                     push = false;
                  } else {
                     // console.log('blur: typeaheadIsVisible is NOT visible');
                     push = true;
                  }
               }

               if (push) {
                  // console.log('lost focus');
                  var user_input = jQuery(this).val(); //user_input = jQuery().inArray(delimeters[p]);
                  user_input = trimTag(user_input);
                  pushTag(user_input);
                  // console.log("pushTag: blur");
               }
            });
         }

         if (tagManagerOptions.prefilled != null) {
            if (typeof (tagManagerOptions.prefilled) == "object") {
               var pta = tagManagerOptions.prefilled;
               jQuery.each(pta, function (key, val) {
                  var a = 1;
                  pushTag(val, obj);
               });
            } else if (typeof (tagManagerOptions.prefilled) == "string") {
               var pta = tagManagerOptions.prefilled.split(',');

               jQuery.each(pta, function (key, val) {
                  var a = 1;
                  pushTag(val, obj);
               });

            }
         }
      });

   }
})(jQuery);