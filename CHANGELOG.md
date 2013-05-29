
## 2.4.0

* Feature: Use Bootstrap semantic colors in LESS and CSS (johnnyshields)
* Feature: Added auto-prefill from hidden field if a hiddenTagListId option is set (johnnyshields)
* Feature: Interpolate tag class from the input control class (johnnyshields)
* Feature: API parameter 'typeaheadDelegate' should always pass-through to the Bootstrap typehead instance (johnnyshields)
* Feature: (#53) Add new API parameter 'AjaxPushAllTags', which enables a mode to sync the entire tag state via AJAX (rather than incrementally) each time a tag is added/deleted. (sumegizoltan)
* Feature: Add new API parameter 'onlyTagList' which constrains the input to only options within the typeaheadSource (rishijain)
* Feature: Add Typescript definitition (sumegizoltan)
* Fix: TM initialization before the DOM tree (kenshin)
* Fix: Correct spelling API parameter delimeter -> delimiter. Old spelling still works (johnnyshields)
* Fix: Prevent double-initialization of TagManager (johnnyshields)
* Fix: (#11) Fix selection from Typeahead list in Firefox (sumegizoltan)
* Fix: (#51) Fix name selector by adding quotes (sumegizoltan)
* Fix: (#49, #50) Fix typeahead overrides when typeahead is not used (sumegizoltan)
* Admin: Added docs.html and docs.css which are pulled by welldonethings.com every 5 minutes (max-favilli)
* Admin: Add package.json (max-favilli)
* Admin: Add CHANGELOG.md (johnnyshields)
* Sync: Regenerate CSS from LESS

## 2.3.0 and prior

Refer to GitHub commit history: https://github.com/max-favilli/tagmanager/commits/master